import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PIPELINE_RESULT } from '@/lib/mock-data';
import { processWithGemini, processAudioWithGemini } from '@/lib/gemini';
import { transcribeWithGroq } from '@/lib/groq';
import { PipelineResult, TranscriptItem } from '@/lib/types';
import { getUpload, removeUpload } from '@/lib/upload-cache';

export const maxDuration = 120;

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = 'Operation timed out'): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let isMock = false;
    let sourceText = '';
    let audioFile: File | null = null;
    let uploadId = '';
    let customGeminiKey = '';
    let customGroqKey = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      audioFile = formData.get('audio') as File | null;
      uploadId = (formData.get('uploadId') as string) || '';
      sourceText = (formData.get('text') as string) || '';
      isMock = formData.get('useMock') === 'true';
      customGeminiKey = (formData.get('geminiKey') as string) || '';
      customGroqKey = (formData.get('groqKey') as string) || '';
    } else {
      const body = await req.json();
      uploadId = body.uploadId || '';
      sourceText = body.text || '';
      isMock = body.useMock || false;
      customGeminiKey = body.geminiKey || '';
      customGroqKey = body.groqKey || '';
    }

    const effectiveGeminiKey = customGeminiKey || process.env.GEMINI_API_KEY;
    const effectiveGroqKey = customGroqKey || process.env.GROQ_API_KEY;

    // Fast-path: Explicit Mock mode or missing Gemini key
    if (isMock || (!effectiveGeminiKey && !sourceText && !audioFile && !uploadId)) {
      return NextResponse.json({
        ...MOCK_PIPELINE_RESULT,
        id: `demo-${Date.now()}`,
        isMock: true,
        createdAt: new Date().toISOString()
      });
    }

    if (!effectiveGeminiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY не настроен. Пожалуйста, укажите ключ в настройках или в файле .env.local.' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Check for pre-uploaded file or direct file
    let audioBuffer: Buffer | null = null;
    let mimeType = '';
    let fileName = '';
    let fileSize = 0;
    let precomputedStt: { text: string; segments: TranscriptItem[] } | null = null;

    if (uploadId) {
      const cached = getUpload(uploadId);
      if (cached) {
        audioBuffer = cached.buffer;
        mimeType = cached.mimeType;
        fileName = cached.fileName;
        fileSize = cached.size;

        if (cached.sttResult) {
          precomputedStt = cached.sttResult;
        } else if (cached.sttPromise) {
          try {
            precomputedStt = await withTimeout(cached.sttPromise, 25000, 'Pre-STT timeout');
          } catch (e) {
            console.warn('[Process] Precomputed STT wait failed or timed out:', e);
          }
        }
        removeUpload(uploadId);
      }
    } else if (audioFile && audioFile.size > 0) {
      audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      fileName = audioFile.name;
      fileSize = audioFile.size;
      mimeType = audioFile.type || '';
      if (!mimeType) {
        const name = fileName.toLowerCase();
        if (name.endsWith('.mp4')) mimeType = 'video/mp4';
        else if (name.endsWith('.mov')) mimeType = 'video/quicktime';
        else if (name.endsWith('.webm')) mimeType = 'video/webm';
        else if (name.endsWith('.wav')) mimeType = 'audio/wav';
        else if (name.endsWith('.m4a')) mimeType = 'audio/m4a';
        else mimeType = 'audio/mp3';
      }
    }

    // SCENARIO 1: Audio / Media file provided
    if (audioBuffer && audioBuffer.length > 0) {
      let rawTranscript = '';
      let transcriptSegments: TranscriptItem[] = [];
      let geminiResult;
      let groqSuccess = false;

      if (precomputedStt) {
        rawTranscript = precomputedStt.text;
        transcriptSegments = precomputedStt.segments;
        groqSuccess = true;
        console.log(`[Audio Pipeline] Using instant precomputed Groq STT transcript (${rawTranscript.length} chars).`);
      } else if (effectiveGroqKey && fileSize <= 24 * 1024 * 1024 && !mimeType.startsWith('video/')) {
        try {
          const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
          const fileForGroq = new File([blob], fileName || 'audio.wav', { type: mimeType });
          const sttResult = await withTimeout(
            transcribeWithGroq(fileForGroq, effectiveGroqKey),
            45000,
            'Groq timeout'
          );
          rawTranscript = sttResult.text;
          transcriptSegments = sttResult.segments;
          groqSuccess = true;
        } catch (groqErr) {
          console.warn('[Audio Pipeline] Groq STT unavailable or timed out, using Gemini Multimodal Audio directly.', groqErr);
        }
      }

      if (groqSuccess && rawTranscript) {
        // Groq transcribed the audio, now process with Gemini
        geminiResult = await processWithGemini(rawTranscript, effectiveGeminiKey);
      } else {
        // Direct Gemini Multimodal Audio processing via Google Files API
        geminiResult = await processAudioWithGemini(audioBuffer, mimeType, effectiveGeminiKey);
        if (geminiResult.transcript && geminiResult.transcript.length > 0) {
          transcriptSegments = geminiResult.transcript;
          rawTranscript = transcriptSegments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n');
        } else {
          rawTranscript = geminiResult.outputs.ru?.web_article || 'Транскрипт сформирован';
        }
      }

      const processingTime = ((Date.now() - startTime) / 1000);

      const responseData: PipelineResult = {
        id: `result-${Date.now()}`,
        title: geminiResult.title || fileName || 'Медиа материал',
        sourceLang: 'mixed',
        rawTranscriptText: rawTranscript,
        transcript:
          transcriptSegments.length > 0
            ? transcriptSegments
            : [
                {
                  id: 't-1',
                  timestamp: '00:00',
                  speaker: 'Спикер',
                  text: rawTranscript,
                  flagIds: []
                }
              ],
        flags: geminiResult.flags,
        factCheckItems: geminiResult.factCheckItems,
        outputs: geminiResult.outputs,
        isMock: false,
        createdAt: new Date().toISOString(),
        stats: {
          audioLength: `${Math.round(fileSize / 1024 / 10)}s`,
          wordCount: rawTranscript.split(/\s+/).length,
          totalFlags: geminiResult.factCheckItems.length,
          verifiedFlags: 0,
          processingTimeSec: Number(processingTime.toFixed(1))
        }
      };

      return NextResponse.json(responseData);
    }

    // SCENARIO 2: Text input provided
    if (sourceText.trim()) {
      const geminiResult = await processWithGemini(sourceText, effectiveGeminiKey);

      // Create timestamped segments from text lines if possible
      const lines = sourceText.split('\n').filter(l => l.trim().length > 0);
      const transcriptSegments: TranscriptItem[] = lines.map((line, idx) => {
        const timeMatch = line.match(/^\[?(\d{2}:\d{2})\]?/);
        const timestamp = timeMatch ? timeMatch[1] : `00:${(idx * 15).toString().padStart(2, '0')}`;
        const cleanText = line.replace(/^\[?\d{2}:\d{2}\]?\s*/, '').trim();
        const mainSpeaker = geminiResult.factCheckItems[0]?.speaker || 'Эксперт';
        return {
          id: `t-${idx + 1}`,
          timestamp,
          speaker: idx % 2 === 0 ? mainSpeaker : 'Интервьюер',
          text: cleanText,
          flagIds: []
        };
      });

      const processingTime = ((Date.now() - startTime) / 1000);

      const responseData: PipelineResult = {
        id: `result-${Date.now()}`,
        title: geminiResult.title || 'Редакционный материал',
        sourceLang: 'mixed',
        rawTranscriptText: sourceText,
        transcript:
          transcriptSegments.length > 0
            ? transcriptSegments
            : [
                {
                  id: 't-1',
                  timestamp: '00:00',
                  speaker: 'Спикер',
                  text: sourceText,
                  flagIds: []
                }
              ],
        flags: geminiResult.flags,
        factCheckItems: geminiResult.factCheckItems,
        outputs: geminiResult.outputs,
        isMock: false,
        createdAt: new Date().toISOString(),
        stats: {
          wordCount: sourceText.split(/\s+/).length,
          totalFlags: geminiResult.factCheckItems.length,
          verifiedFlags: 0,
          processingTimeSec: Number(processingTime.toFixed(1))
        }
      };

      return NextResponse.json(responseData);
    }

    // Fallback: If nothing was sent, return mock
    return NextResponse.json({
      ...MOCK_PIPELINE_RESULT,
      id: `demo-${Date.now()}`,
      isMock: true
    });
  } catch (error: unknown) {
    console.error('Pipeline process error:', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
