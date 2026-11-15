import { MultilingualOutputs, VerificationFlag, FactCheckItem, TranscriptItem } from './types';
import { buildTextPrompt, buildAudioPrompt, sanitizeOutputTypography } from './prompts';
import { findMatchingGroundingChunk } from './source-grounding';

export interface GeminiProcessResponse {
  title: string;
  transcript?: TranscriptItem[];
  factCheckItems: FactCheckItem[];
  flags: VerificationFlag[];
  outputs: MultilingualOutputs;
}

// Modern production models: gemini-3.5-flash-lite (fastest, lowest latency), gemini-3.8-flash, and gemini-3.6-flash
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash'
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function getGenerationConfigForModel(model: string, baseConfig?: Record<string, unknown>) {
  const config: Record<string, unknown> = {
    temperature: 0.2,
    responseMimeType: 'application/json',
    maxOutputTokens: 16384,
    ...(baseConfig || {})
  };

  // Eliminate thinking latency so streaming begins within < 400ms without reasoning pauses
  if (model.includes('gemini-3')) {
    config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
  } else {
    config.thinkingConfig = { thinkingBudget: 0 };
  }

  return config;
}

export function clampFactQuoteText(text: string, isBefore: boolean, maxWords = 18): string {
  if (!text) return '';
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) {
    return isBefore ? `${trimmed} ` : ` ${trimmed}`;
  }
  if (isBefore) {
    return `...${words.slice(-maxWords).join(' ')} `;
  } else {
    return ` ${words.slice(0, maxWords).join(' ')}...`;
  }
}

function extractCompletedFacts(
  accumulated: string,
  emittedIds: Set<string>,
  onFact?: (fact: FactCheckItem) => void
) {
  if (!onFact) return;

  const arrayStart = accumulated.indexOf('"factCheckItems"');
  if (arrayStart === -1) return;
  const bracketOpen = accumulated.indexOf('[', arrayStart);
  if (bracketOpen === -1) return;

  let i = bracketOpen + 1;
  while (i < accumulated.length) {
    const objStart = accumulated.indexOf('{', i);
    if (objStart === -1) break;

    let depth = 0;
    let inString = false;
    let escape = false;
    let objEnd = -1;

    for (let j = objStart; j < accumulated.length; j++) {
      const ch = accumulated[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            objEnd = j;
            break;
          }
        }
      }
    }

    if (objEnd !== -1) {
      const candidateJson = accumulated.slice(objStart, objEnd + 1);
      try {
        const item = JSON.parse(candidateJson);
        if (item && item.id && !emittedIds.has(item.id) && (item.factCheckInfo || item.highlightedFact)) {
          emittedIds.add(item.id);
          const sanitizedItem: FactCheckItem = {
            ...item,
            textBefore: clampFactQuoteText(item.textBefore || '', true, 16),
            textAfter: clampFactQuoteText(item.textAfter || '', false, 16)
          };
          onFact(sanitizedItem);
        }
      } catch {
        // Not a complete valid json object yet
      }
      i = objEnd + 1;
    } else {
      break;
    }
  }
}

function extractDraftChunks(
  accumulated: string,
  state: { lastIndex: number; inEscape: boolean },
  onChunk?: (chunk: string) => void
) {
  if (!onChunk) return;

  const marker = '"web_article":';
  const markerPos = accumulated.indexOf(marker);
  if (markerPos === -1) return;

  const quoteStart = accumulated.indexOf('"', markerPos + marker.length);
  if (quoteStart === -1) return;

  const contentStart = quoteStart + 1;
  if (state.lastIndex < contentStart) {
    state.lastIndex = contentStart;
    state.inEscape = false;
  }

  let j = state.lastIndex;
  let unescapedChunk = '';

  while (j < accumulated.length) {
    const ch = accumulated[j];
    if (state.inEscape) {
      if (ch === 'n') unescapedChunk += '\n';
      else if (ch === 'r') unescapedChunk += '\r';
      else if (ch === 't') unescapedChunk += '\t';
      else if (ch === '"') unescapedChunk += '"';
      else if (ch === '\\') unescapedChunk += '\\';
      else unescapedChunk += ch;
      state.inEscape = false;
      j++;
      continue;
    }
    if (ch === '\\') {
      state.inEscape = true;
      j++;
      continue;
    }
    if (ch === '"') {
      // Reached closing quote of web_article
      break;
    }
    unescapedChunk += ch;
    j++;
  }

  if (unescapedChunk.length > 0) {
    state.lastIndex = j;
    onChunk(unescapedChunk);
  }
}

export interface GeminiCallResult {
  rawContent: string;
  groundingChunks: Array<{ uri: string; title: string }>;
}

export async function streamGeminiWithFallback(
  payload: Record<string, unknown>,
  apiKey: string,
  callbacks: {
    onFact?: (fact: FactCheckItem) => void;
    onDraftChunk?: (chunk: string) => void;
  }
): Promise<GeminiCallResult> {
  let lastError: Error | null = null;
  const emittedFactIds = new Set<string>();
  const draftState = { lastIndex: 0, inEscape: false };
  const groundingChunks: Array<{ uri: string; title: string }> = [];

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
        const genConfig = getGenerationConfigForModel(model, payload.generationConfig as Record<string, unknown>);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            generationConfig: genConfig
          }),
          signal: AbortSignal.timeout(120000)
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.warn(`[Gemini Stream] Model ${model} (attempt ${attempt}) returned ${res.status}:`, errorText.slice(0, 120));
          if (res.status === 503 || res.status === 429) {
            lastError = new Error(`Model ${model} temporarily busy (${res.status})`);
            await sleep(1500);
            continue;
          }
          if (res.status === 404) {
            break;
          }
          throw new Error(`Gemini Stream error (${res.status}): ${errorText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullRawText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const eventData = JSON.parse(dataStr);
              // Extract real Google Search Grounding metadata if available
              const metadata = eventData.candidates?.[0]?.groundingMetadata;
              if (metadata?.groundingChunks && Array.isArray(metadata.groundingChunks)) {
                for (const chunk of metadata.groundingChunks) {
                  if (chunk.web?.uri) {
                    groundingChunks.push({
                      uri: chunk.web.uri,
                      title: chunk.web.title || ''
                    });
                  }
                }
              }

              const chunk = eventData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunk) {
                fullRawText += chunk;
                extractCompletedFacts(fullRawText, emittedFactIds, callbacks.onFact);
                extractDraftChunks(fullRawText, draftState, callbacks.onDraftChunk);
              }
            } catch {
              // Ignore partial SSE framing
            }
          }
        }

        if (fullRawText.trim()) {
          return { rawContent: fullRawText, groundingChunks };
        }

        throw new Error(`Model ${model} returned empty streamed content`);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[Gemini Stream] Failed with model ${model} (attempt ${attempt}):`, lastError.message);
        if (attempt < 2) await sleep(1000);
      }
    }
  }

  // Fallback to non-streaming if all streaming attempts failed
  return callGeminiWithFallback(payload, apiKey);
}

async function callGeminiWithFallback(
  payload: Record<string, unknown>,
  apiKey: string
): Promise<GeminiCallResult> {
  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const genConfig = getGenerationConfigForModel(model, payload.generationConfig as Record<string, unknown>);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            generationConfig: genConfig
          }),
          signal: AbortSignal.timeout(120000)
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
        const metadata = data.candidates?.[0]?.groundingMetadata;
        const groundingChunks: Array<{ uri: string; title: string }> = [];
        if (metadata?.groundingChunks && Array.isArray(metadata.groundingChunks)) {
          for (const chunk of metadata.groundingChunks) {
            if (chunk.web?.uri) {
              groundingChunks.push({ uri: chunk.web.uri, title: chunk.web.title || '' });
            }
          }
        }

        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) {
          throw new Error(`Model ${model} returned empty content`);
        }
        return { rawContent, groundingChunks };
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
    signal: AbortSignal.timeout(180000)
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
  while (file && file.state === 'PROCESSING' && attempts < 45) {
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

function repairTruncatedJson(text: string): Record<string, unknown> | null {
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop();
        }
      }
    }
  }

  let repaired = text;
  if (inString) repaired += '"';
  while (stack.length > 0) {
    repaired += stack.pop();
  }

  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(repaired) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function cleanMalformedJsonSyntax(raw: string): string {
  let res = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const jsonMatch = res.match(/\{[\s\S]*\}/);
  if (jsonMatch) res = jsonMatch[0];

  // 1. Если ключ не имеет значения перед запятой, а следом идет следующий ключ:
  // например: ':, "nextKey":' или ': , "nextKey":' -> ': "", "nextKey":'
  res = res.replace(/:\s*,\s*(?="[^"]+"\s*:)/g, ': "", ');

  // 2. Двоеточие с запятой и текстом без открывающей кавычки:
  // ': , ән айтуғ"' -> ': "ән айтуғ"'
  res = res.replace(/:\s*,\s*([^"{\[\dntf\-\s][^"]*")/g, ': "$1');

  // 3. Двоеточие с запятой и открывающей кавычкой значения:
  // ': ,"foo"' -> ': "foo"'
  res = res.replace(/:\s*,\s*"/g, ': "');

  // 4. Одиночное двоеточие с запятой в конце свойства или перед следующим ключом:
  // ': ,' -> ': "",'
  res = res.replace(/:\s*,/g, ': "",');

  // 5. Очистка висячих запятых перед закрывающими фигурными/квадратными скобками:
  res = res.replace(/,\s*([}\]])/g, '$1');

  return res;
}

function parseJsonSafely<T = Record<string, unknown>>(raw: string): T {
  let cleaned = cleanMalformedJsonSyntax(raw);

  try {
    return JSON.parse(cleaned) as T;
  } catch (initialErr) {
    // Экранируем сырые символы переноса строк (\n, \r), табуляции и управляющие символы внутри строк
    let inString = false;
    let escaped = false;
    let fixed = '';

    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escaped) {
        fixed += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        fixed += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        fixed += ch;
        continue;
      }
      if (inString) {
        if (ch === '\n') {
          fixed += '\\n';
          continue;
        }
        if (ch === '\r') {
          fixed += '\\r';
          continue;
        }
        if (ch === '\t') {
          fixed += '\\t';
          continue;
        }
        const code = ch.charCodeAt(0);
        if (code < 32) {
          fixed += `\\u${code.toString(16).padStart(4, '0')}`;
          continue;
        }
      }
      fixed += ch;
    }

    try {
      return JSON.parse(fixed) as T;
    } catch {
      const cleanedAgain = cleanMalformedJsonSyntax(fixed);
      try {
        return JSON.parse(cleanedAgain) as T;
      } catch {
        const repaired = repairTruncatedJson(cleanedAgain) || repairTruncatedJson(fixed) || repairTruncatedJson(cleaned);
        if (repaired) return repaired as unknown as T;
        throw initialErr;
      }
    }
  }
}

function decodeJsonStringSafe(str: string): string {
  const trimmed = str.trim();
  const withQuotes = trimmed.startsWith('"') && trimmed.endsWith('"')
    ? trimmed
    : `"${trimmed.replace(/^"|"$/g, '').replace(/\\"/g, '"').replace(/"/g, '\\"')}"`;
  try {
    return JSON.parse(withQuotes);
  } catch {
    return str
      .replace(/^"|"$/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }
}

function extractFieldsResiliently(raw: string): Record<string, unknown> {
  // 1. Extract title
  let title = 'Редакционный материал Qalam AI';
  const titleMatch = raw.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (titleMatch) {
    try {
      title = JSON.parse(`"${titleMatch[1]}"`);
    } catch {
      title = decodeJsonStringSafe(titleMatch[1]);
    }
  }

  // 2. Extract web_article
  let webArticle = '';
  const articleMarker = '"web_article":';
  const artIdx = raw.indexOf(articleMarker);
  if (artIdx !== -1) {
    const quoteStart = raw.indexOf('"', artIdx + articleMarker.length);
    if (quoteStart !== -1) {
      let j = quoteStart + 1;
      let inEscape = false;
      while (j < raw.length) {
        const ch = raw[j];
        if (inEscape) {
          inEscape = false;
          j++;
          continue;
        }
        if (ch === '\\') {
          inEscape = true;
          j++;
          continue;
        }
        if (ch === '"') break;
        j++;
      }
      const rawArticleStr = raw.slice(quoteStart, j + 1);
      try {
        webArticle = JSON.parse(rawArticleStr.endsWith('"') ? rawArticleStr : rawArticleStr + '"');
      } catch {
        webArticle = decodeJsonStringSafe(raw.slice(quoteStart + 1, j));
      }
    }
  }

  // 3. Extract telegram_post
  let telegramPost = '';
  const tgMarker = '"telegram_post":';
  const tgIdx = raw.indexOf(tgMarker);
  if (tgIdx !== -1) {
    const quoteStart = raw.indexOf('"', tgIdx + tgMarker.length);
    if (quoteStart !== -1) {
      let j = quoteStart + 1;
      let inEscape = false;
      while (j < raw.length) {
        const ch = raw[j];
        if (inEscape) { inEscape = false; j++; continue; }
        if (ch === '\\') { inEscape = true; j++; continue; }
        if (ch === '"') break;
        j++;
      }
      try {
        telegramPost = JSON.parse(raw.slice(quoteStart, j + 1));
      } catch {
        telegramPost = decodeJsonStringSafe(raw.slice(quoteStart + 1, j));
      }
    }
  }

  // 4. Extract social_script
  let socialScript = '';
  const scriptMarker = '"social_script":';
  const scriptIdx = raw.indexOf(scriptMarker);
  if (scriptIdx !== -1) {
    const quoteStart = raw.indexOf('"', scriptIdx + scriptMarker.length);
    if (quoteStart !== -1) {
      let j = quoteStart + 1;
      let inEscape = false;
      while (j < raw.length) {
        const ch = raw[j];
        if (inEscape) { inEscape = false; j++; continue; }
        if (ch === '\\') { inEscape = true; j++; continue; }
        if (ch === '"') break;
        j++;
      }
      try {
        socialScript = JSON.parse(raw.slice(quoteStart, j + 1));
      } catch {
        socialScript = decodeJsonStringSafe(raw.slice(quoteStart + 1, j));
      }
    }
  }

  // 5. Extract completed fact check items using bracket scanner
  const factItems: FactCheckItem[] = [];
  const emittedIds = new Set<string>();
  extractCompletedFacts(raw, emittedIds, (fact) => {
    factItems.push(fact);
  });

  return {
    title,
    factCheckItems: factItems,
    outputs: {
      ru: {
        web_article: webArticle,
        telegram_post: telegramPost,
        social_script: socialScript
      }
    }
  };
}

function parseAndSanitizeResponse(
  rawContent: string,
  groundingChunks?: Array<{ uri: string; title: string }>
): GeminiProcessResponse {
  let parsed: Record<string, unknown> | null = null;
  const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');

  // Attempt 1: Direct JSON parse
  if (firstBrace !== -1) {
    const candidate = cleaned.slice(firstBrace);
    try {
      parsed = JSON.parse(candidate);
    } catch {
      const lastBrace = candidate.lastIndexOf('}');
      if (lastBrace !== -1) {
        try {
          parsed = JSON.parse(candidate.slice(0, lastBrace + 1));
        } catch {
          // Proceed to repair
        }
      }
    }
  }

  // Attempt 2: Structural repair for truncated output
  if (!parsed && firstBrace !== -1) {
    try {
      parsed = repairTruncatedJson(cleaned.slice(firstBrace));
    } catch {
      // Fallback to resilient extraction
    }
  }

  // Attempt 3: Resilient field extraction (guarantees material is recovered even if cut off)
  if (!parsed) {
    console.warn('[Gemini] Incomplete JSON from model, recovering fields via resilient parser...');
    parsed = extractFieldsResiliently(rawContent);
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
    en: { ...defaultPlatformOutputs, ...((parsedOutputs.en as Record<string, string>) || {}) }
  };

  const rawFactCheckItems: FactCheckItem[] = Array.isArray(parsed.factCheckItems)
    ? (parsed.factCheckItems as FactCheckItem[])
    : [];

  const factCheckItems: FactCheckItem[] = rawFactCheckItems.map((item) => ({
    ...item,
    textBefore: clampFactQuoteText(item.textBefore || '', true, 16),
    textAfter: clampFactQuoteText(item.textAfter || '', false, 16)
  }));

  // If real Google Search Grounding chunks were returned by Gemini, map them directly to facts
  if (groundingChunks && groundingChunks.length > 0) {
    for (let i = 0; i < factCheckItems.length; i++) {
      const fc = factCheckItems[i];
      if (!fc.factCheckInfo) continue;
      const match =
        findMatchingGroundingChunk(`${fc.searchQuery || ''} ${fc.highlightedFact || ''} ${fc.factCheckInfo?.claimed || ''}`, groundingChunks) ||
        groundingChunks[i % groundingChunks.length];
      if (match && match.uri) {
        fc.factCheckInfo.sourceUrl = match.uri;
        if (match.title) {
          fc.factCheckInfo.source = match.title.slice(0, 35);
        }
      }
    }
  }

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
  customStyleGuide?: string,
  fileName?: string
): Promise<GeminiProcessResponse> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const promptText = buildTextPrompt(transcriptText, customStyleGuide, fileName);

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

  const { rawContent, groundingChunks } = await callGeminiWithFallback(payload, key);
  return parseAndSanitizeResponse(rawContent, groundingChunks);
}




export async function processAudioWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey?: string,
  customStyleGuide?: string,
  fileName?: string
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
  const audioPrompt = buildAudioPrompt(customStyleGuide, fileName);

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

  const { rawContent, groundingChunks } = await callGeminiWithFallback(payload, key);
  return parseAndSanitizeResponse(rawContent, groundingChunks);
}

export async function processWithGeminiStream(
  transcriptText: string,
  callbacks: {
    onFact?: (fact: FactCheckItem) => void;
    onDraftChunk?: (chunk: string) => void;
  },
  apiKey?: string,
  customStyleGuide?: string,
  fileName?: string
): Promise<GeminiProcessResponse> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const promptText = buildTextPrompt(transcriptText, customStyleGuide, fileName);

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

  const { rawContent, groundingChunks } = await streamGeminiWithFallback(payload, key, callbacks);
  return parseAndSanitizeResponse(rawContent, groundingChunks);
}

export async function processAudioWithGeminiStream(
  audioBuffer: Buffer,
  mimeType: string,
  callbacks: {
    onFact?: (fact: FactCheckItem) => void;
    onDraftChunk?: (chunk: string) => void;
  },
  apiKey?: string,
  customStyleGuide?: string,
  fileName?: string
): Promise<GeminiProcessResponse> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  console.log(`[Gemini Audio Stream] Uploading ${audioBuffer.length} bytes via Google Files API...`);
  const fileUri = await uploadToGeminiFiles(audioBuffer, mimeType, key);
  console.log(`[Gemini Audio Stream] Uploaded file URI: ${fileUri}`);

  const audioPrompt = buildAudioPrompt(customStyleGuide, fileName);

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

  const { rawContent, groundingChunks } = await streamGeminiWithFallback(payload, key, callbacks);
  return parseAndSanitizeResponse(rawContent, groundingChunks);
}

export interface TranslatedFactItem {
  id: string;
  speaker?: string;
  textBefore: string;
  highlightedFact: string;
  textAfter: string;
  factCheckInfo: {
    title: string;
    claimed: string;
    verified: string;
    suggestedFix: string;
  };
}

export async function translateEditorialPackage(
  article: string,
  telegram: string,
  scenario: string,
  targetPhrases: string[],
  targetFixes: string[],
  targetLang: 'kz' | 'en',
  apiKey?: string,
  facts?: FactCheckItem[]
): Promise<{
  outputs: {
    web_article: string;
    telegram_post: string;
    social_script: string;
  };
  translatedPhrases: string[];
  translatedFixes: string[];
  translatedFacts?: TranslatedFactItem[];
}> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const langDescription =
    targetLang === 'kz'
      ? 'казахский язык (высокий публицистический стиль ведущих независимых изданий Казахстана: Азаттык, Baribar, Masa.media, без дословной кальки с русского)'
      : 'английский язык (профессиональный новостной стиль AP / Reuters)';

  const factsJson = (facts || []).map((f) => ({
    id: f.id,
    speaker: f.speaker || 'Спикер',
    textBefore: f.textBefore || '',
    highlightedFact: f.highlightedFact || '',
    textAfter: f.textAfter || '',
    factCheckInfo: {
      title: f.factCheckInfo?.title || '',
      claimed: f.factCheckInfo?.claimed || '',
      verified: f.factCheckInfo?.verified || '',
      suggestedFix: f.factCheckInfo?.suggestedFix || ''
    }
  }));

  const prompt = `Ты — ведущий переводчик и редактор издания Qalam AI.
Переведи следующий готовый редакционный пакет на ${langDescription}.

СТРОГИЕ ПРАВИЛА РЕДПОЛИТИКИ:
1. НЕ используй длинное тире / эм дэш ("—"), используй ТОЛЬКО обычный дефис ("-").
2. В казахском тексте сохраняй живую журналистскую структуру ведущих изданий (Азаттык, Baribar, Masa.media), избегай кальки.
3. В сценарии Reels/TikTok (social_script):
   - ОБЯЗАТЕЛЬНО переводи ВСЕ шаблонные служебные метки и заголовки блоков на целевой язык!
     Для казахского языка (KZ):
     * "Текст на экране:" -> переводи как "Экрандағы мәтін:" (или "Экранда:")
     * "Закадровый голос:" -> переводи как "Кадр сыртындағы дауыс:"
     * [00:00-00:05 | ХУК] -> [00:00-00:05 | ІЛМЕК]
     * [00:05-00:20 | СУТЬ И КОНТЕКСТ] -> [00:05-00:20 | МӘН-ЖАЙ МЕН КОНТЕКСТ]
     * [00:20-00:40 | ФАКТЧЕК И ДЕТАЛИ] -> [00:20-00:40 | ФАКТЧЕК ЖӘНЕ ДЕТАЛЬДАР]
     * [00:40-00:52 | КУЛЬМИНАЦИЯ И СМЫСЛ] -> [00:40-00:52 | ШЫҢЫ МЕН МАҢЫЗЫ]
     * [00:52-01:00 | ВЫВОД И CTA] -> [00:52-01:00 | ҚОРЫТЫНДЫ ЖӘНЕ ҮНДЕУ]
     Категорически запрещено оставлять русские слова "Текст на экране:" или "Закадровый голос:" в казахском сценарии!

     Для английского языка (EN):
     * "Текст на экране:" -> "On-screen text:"
     * "Закадровый голос:" -> "Voiceover:"
     * [00:00-00:05 | ХУК] -> [00:00-00:05 | HOOK]
     * [00:05-00:20 | СУТЬ И КОНТЕКСТ] -> [00:05-00:20 | CORE & CONTEXT]
     * [00:20-00:40 | ФАКТЧЕК И ДЕТАЛИ] -> [00:20-00:40 | FACT-CHECK & DETAILS]
     * [00:40-00:52 | КУЛЬМИНАЦИЯ И СМЫСЛ] -> [00:40-00:52 | CLIMAX & IMPACT]
     * [00:52-01:00 | ВЫВОД И CTA] -> [00:52-01:00 | CONCLUSION & CTA]
   - Обязательно разделяй блоки таймкодов двойными переносами строк (\\n\\n).
4. Каждая переведенная фраза из "targetPhrases" ОБЯЗАНА ДОСЛОВНО присутствовать в переведенной статье "web_article"!
5. Если в статье "web_article" есть Markdown-таблицы метрик (|---|---|), полностью сохрани их структуру и переведи заголовки колонок и текст ячеек на ${targetLang === 'kz' ? 'казахский' : 'английский'} язык!
6. В фактчекинге ("translatedFacts"):
   - Полностью переведи цитату спикера ("textBefore", "highlightedFact", "textAfter") на ${targetLang === 'kz' ? 'казахский' : 'английский'} язык, чтобы фраза звучала естественно и грамотно.
   - Переведи описание проверки ("title", "claimed", "verified", "suggestedFix") на ${targetLang === 'kz' ? 'казахский' : 'английский'} язык.
   - В поле "speaker" сохрани имя человека или переведи роль (например, 'Интервьюер' -> '${targetLang === 'kz' ? 'Сұхбат алушы' : 'Interviewer'}').
   - СТРОГО: Каждое строковое поле ("textBefore", "highlightedFact", "textAfter") ОБЯЗАНО быть обернуто в двойные кавычки (например: "textAfter": "ән айтуға..."). Категорически запрещено оставлять значения без кавычек или ставить запятую сразу после двоеточия!

ИСХОДНЫЕ ДАННЫЕ:
Статья (web_article):
${article}

Telegram-пост (telegram_post):
${telegram}

Сценарий (social_script):
${scenario}

Фразы фактчекинга для поиска в статье:
${JSON.stringify(targetPhrases)}

Исправления для фактчекинга:
${JSON.stringify(targetFixes)}

Карточки фактчекинга для перевода:
${JSON.stringify(factsJson)}

ВЕРНИ СТРОГО ВАЛИДНЫЙ JSON С ТАКОЙ СТРУКТУРОЙ:
{
  "web_article": "<string: переведенная markdown статья>",
  "telegram_post": "<string: переведенный telegram пост>",
  "social_script": "<string: переведенный сценарий>",
  "translatedPhrases": ["<string: переведенная фраза 1>", ...],
  "translatedFixes": ["<string: переведенное исправление 1>", ...],
  "translatedFacts": [
    {
      "id": "<string: fc-1>",
      "speaker": "<string: имя или роль>",
      "textBefore": "<string: цитата до факта на целевом языке>",
      "highlightedFact": "<string: выделенный факт на целевом языке>",
      "textAfter": "<string: цитата после факта на целевом языке>",
      "factCheckInfo": {
        "title": "<string: заголовок проверки на целевом языке>",
        "claimed": "<string: утверждение на целевом языке>",
        "verified": "<string: проверка на целевом языке>",
        "suggestedFix": "<string: рекомендация на целевом языке>"
      }
    }
  ]
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  };

  const { rawContent } = await callGeminiWithFallback(payload, key);
  let cleaned = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  const parsed = parseJsonSafely<Record<string, unknown>>(cleaned);

  let localizedScript = (parsed.social_script as string) || '';
  let localizedTelegram = (parsed.telegram_post as string) || '';

  // Bulletproof safety-net: enforce localized headers in social script & telegram
  if (targetLang === 'kz') {
    localizedScript = localizedScript
      .replace(/(?:Текст на экране|Текст на экран):/gi, 'Экрандағы мәтін:')
      .replace(/(?:Закадровый голос|Голос за кадром):/gi, 'Кадр сыртындағы дауыс:')
      .replace(/\|\s*ХУК\]/gi, '| ІЛМЕК]')
      .replace(/\|\s*СУТЬ И КОНТЕКСТ\]/gi, '| МӘН-ЖАЙ МЕН КОНТЕКСТ]')
      .replace(/\|\s*ФАКТЧЕК И ДЕТАЛИ\]/gi, '| ФАКТЧЕК ЖӘНЕ ДЕТАЛЬДАР]')
      .replace(/\|\s*КУЛЬМИНАЦИЯ И СМЫСЛ\]/gi, '| ШЫҢЫ МЕН МАҢЫЗЫ]')
      .replace(/\|\s*ВЫВОД И (?:CTA|ПРИЗЫВ)\]/gi, '| ҚОРЫТЫНДЫ ЖӘНЕ ҮНДЕУ]');

    localizedTelegram = localizedTelegram
      .replace(/🔍\s*Подробности\s*[-—]\s*по ссылке/gi, '🔍 Толық ақпарат - сілтемеде')
      .replace(/🔍\s*Подробности\s*[-—]\s*по ссылке/gi, '🔍 Толық ақпарат - сілтемеде');
  } else if (targetLang === 'en') {
    localizedScript = localizedScript
      .replace(/(?:Текст на экране|Текст на экран):/gi, 'On-screen text:')
      .replace(/(?:Закадровый голос|Голос за кадром):/gi, 'Voiceover:')
      .replace(/\|\s*ХУК\]/gi, '| HOOK]')
      .replace(/\|\s*СУТЬ И КОНТЕКСТ\]/gi, '| CORE & CONTEXT]')
      .replace(/\|\s*ФАКТЧЕК И ДЕТАЛИ\]/gi, '| FACT-CHECK & DETAILS]')
      .replace(/\|\s*КУЛЬМИНАЦИЯ И СМЫСЛ\]/gi, '| CLIMAX & IMPACT]')
      .replace(/\|\s*ВЫВОД И (?:CTA|ПРИЗЫВ)\]/gi, '| CONCLUSION & CTA]');

    localizedTelegram = localizedTelegram
      .replace(/🔍\s*Подробности\s*[-—]\s*по ссылке/gi, '🔍 Details - link in bio')
      .replace(/🔍\s*Подробности\s*[-—]\s*по ссылке/gi, '🔍 Read more - link in bio');
  }

  const outputs = {
    web_article: (parsed.web_article as string) || '',
    telegram_post: localizedTelegram,
    social_script: localizedScript
  };

  const translatedFacts = Array.isArray(parsed.translatedFacts)
    ? (parsed.translatedFacts as TranslatedFactItem[])
    : undefined;

  return sanitizeOutputTypography({
    outputs,
    translatedPhrases: Array.isArray(parsed.translatedPhrases) ? (parsed.translatedPhrases as string[]) : [],
    translatedFixes: Array.isArray(parsed.translatedFixes) ? (parsed.translatedFixes as string[]) : [],
    translatedFacts
  });
}



