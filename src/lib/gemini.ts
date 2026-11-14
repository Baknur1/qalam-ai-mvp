import { MultilingualOutputs, VerificationFlag, FactCheckItem, TranscriptItem } from './types';
import { buildTextPrompt, buildAudioPrompt, sanitizeOutputTypography } from './prompts';

export interface GeminiProcessResponse {
  title: string;
  transcript?: TranscriptItem[];
  factCheckItems: FactCheckItem[];
  flags: VerificationFlag[];
  outputs: MultilingualOutputs;
}

// Models ordered by priority: gemini-3-flash-preview handles full 10+ min video & audio with 1M context
const CANDIDATE_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithFallback(payload: Record<string, unknown>, apiKey: string) {
  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(65000)
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.warn(`[Gemini] Model ${model} (attempt ${attempt}) returned ${res.status}:`, errorText.slice(0, 120));
          if (res.status === 503 || res.status === 429) {
            lastError = new Error(`Model ${model} temporarily busy (${res.status})`);
            await sleep(1500);
            continue;
          }
          if (res.status === 404) {
            break;
          }
          throw new Error(`Gemini API error (${res.status}): ${errorText}`);
        }

        const data = await res.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) {
          throw new Error(`Model ${model} returned empty content`);
        }
        return rawContent;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[Gemini] Failed with model ${model} (attempt ${attempt}):`, lastError.message);
        if (attempt < 2) await sleep(1000);
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models failed. Please try again in a few seconds.');
}

async function uploadToGeminiFiles(buffer: Buffer, mimeType: string, apiKey: string): Promise<string> {
  const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'start, upload, finalize',
      'X-Goog-Upload-Header-Content-Length': String(buffer.length),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': mimeType
    },
    body: new Uint8Array(buffer),
    signal: AbortSignal.timeout(60000)
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Files API upload failed (${uploadRes.status}): ${errorText}`);
  }

  const uploadData = await uploadRes.json();
  let file = uploadData.file;
  if (!file || !file.uri) {
    throw new Error('Google Files API did not return a valid file URI');
  }

  // Video files (MP4/MOV) require 2-8 seconds for Google's backend to decode into ACTIVE state
  let attempts = 0;
  while (file && file.state === 'PROCESSING' && attempts < 30) {
    console.log(`[Gemini Media] File ${file.name} is ${file.state}, waiting for ACTIVE state (attempt ${attempts + 1})...`);
    await sleep(2000);
    const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${file.name}?key=${apiKey}`);
    if (checkRes.ok) {
      file = await checkRes.json();
    }
    attempts++;
  }

  if (file && file.state === 'FAILED') {
    throw new Error('Google could not decode the video file.');
  }

  console.log(`[Gemini Media] File ${file.name} is ready (${file.state || 'ACTIVE'})`);
  return file.uri;
}

function parseAndSanitizeResponse(rawContent: string): GeminiProcessResponse {
  // Robust extraction of JSON object even if model added commentary
  let cleaned = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('[Gemini] JSON parsing failed, raw content:', rawContent.slice(0, 300));
    throw new Error('Модель вернула некорректный формат ответа. Попробуйте еще раз.');
  }

  const defaultPlatformOutputs = {
    web_article: '',
    telegram_post: '',
    social_script: ''
  };

  const parsedOutputs = (parsed.outputs as Record<string, unknown>) || {};

  const outputs: MultilingualOutputs = {
    ru: { ...defaultPlatformOutputs, ...((parsedOutputs.ru as Record<string, string>) || {}) },
    kz: { ...defaultPlatformOutputs, ...((parsedOutputs.kz as Record<string, string>) || {}) },
    en: { ...defaultPlatformOutputs, ...((parsedOutputs.en as Record<string, string>) || (parsedOutputs.ru as Record<string, string>) || {}) }
  };

  const factCheckItems: FactCheckItem[] = Array.isArray(parsed.factCheckItems)
    ? (parsed.factCheckItems as FactCheckItem[])
    : [];

  const flags: VerificationFlag[] = factCheckItems.map((fc, idx) => ({
    id: fc.id || `flag-${idx + 1}`,
    text: fc.highlightedFact || fc.targetPhrases?.ru || '',
    type: (fc.factCheckInfo?.type === 'discrepancy' ? 'number' : 'claim') as VerificationFlag['type'],
    timestamp: fc.time || '00:00',
    reason: fc.factCheckInfo?.verified || fc.factCheckInfo?.title || 'Требуется проверка',
    suggestedCorrection: fc.fixes?.ru?.replacement || fc.factCheckInfo?.suggestedFix,
    verified: false
  }));

  const response: GeminiProcessResponse = {
    title: (parsed.title as string) || 'Редакционный материал Qalam AI',
    transcript: (parsed.transcript as TranscriptItem[]) || undefined,
    factCheckItems,
    flags,
    outputs
  };

  return sanitizeOutputTypography(response);
}

export async function processWithGemini(
  transcriptText: string,
  apiKey?: string,
  customStyleGuide?: string
): Promise<GeminiProcessResponse> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const promptText = buildTextPrompt(transcriptText, customStyleGuide);

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  const rawContent = await callGeminiWithFallback(payload, key);
  return parseAndSanitizeResponse(rawContent);
}

export async function processAudioWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey?: string,
  customStyleGuide?: string
): Promise<GeminiProcessResponse> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // 1. Stream binary audio to Google AI Files API (avoids 503 base64 memory throttling)
  console.log(`[Gemini Audio] Uploading ${audioBuffer.length} bytes via Google Files API...`);
  const fileUri = await uploadToGeminiFiles(audioBuffer, mimeType, key);
  console.log(`[Gemini Audio] Uploaded file URI: ${fileUri}`);

  // 2. Generate structured editorial content using the fileData URI reference
  const audioPrompt = buildAudioPrompt(customStyleGuide);

  const payload = {
    contents: [
      {
        parts: [
          { text: audioPrompt },
          {
            fileData: {
              mimeType: mimeType || 'audio/mp3',
              fileUri: fileUri
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  const rawContent = await callGeminiWithFallback(payload, key);
  return parseAndSanitizeResponse(rawContent);
}
