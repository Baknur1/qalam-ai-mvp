import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PIPELINE_RESULT } from '@/lib/mock-data';
import {
  processWithGemini,
  processAudioWithGemini,
  processWithGeminiStream,
  processAudioWithGeminiStream
} from '@/lib/gemini';
import { transcribeWithGroq } from '@/lib/groq';
import { PipelineResult, TranscriptItem, FactCheckItem } from '@/lib/types';
import { getUpload, removeUpload } from '@/lib/upload-cache';
import { enrichFactSource } from '@/lib/source-grounding';

export const maxDuration = 300;

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = 'Operation timed out'): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  // Предотвращаем UnhandledPromiseRejection, если промис завершится ошибкой уже после срабатывания таймера
  promise.catch(() => { });

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function sseChunk(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const wantsStream =
      req.headers.get('accept')?.includes('text/event-stream') ||
      req.nextUrl.searchParams.get('stream') === 'true';

    let isMock = false;
    let sourceText = '';
    let audioFile: File | null = null;
    let uploadId = '';
    let blobUrl = '';
    let customGeminiKey = '';
    let customGroqKey = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      audioFile = formData.get('audio') as File | null;
      uploadId = (formData.get('uploadId') as string) || '';
      blobUrl = (formData.get('blobUrl') as string) || '';
      sourceText = (formData.get('text') as string) || '';
      isMock = formData.get('useMock') === 'true';
      customGeminiKey = (formData.get('geminiKey') as string) || '';
      customGroqKey = (formData.get('groqKey') as string) || '';
    } else {
      const body = await req.json();
      uploadId = body.uploadId || '';
      blobUrl = body.blobUrl || '';
      sourceText = body.text || '';
      isMock = body.useMock || false;
      customGeminiKey = body.geminiKey || '';
      customGroqKey = body.groqKey || '';
    }

    const effectiveGeminiKey = customGeminiKey || process.env.GEMINI_API_KEY;
    const effectiveGroqKey = customGroqKey || process.env.GROQ_API_KEY;

    // Fast-path: Explicit Mock mode or missing Gemini key
    if (isMock || (!effectiveGeminiKey && !sourceText && !audioFile && !uploadId && !blobUrl)) {
      const mockData = {
        ...MOCK_PIPELINE_RESULT,
        id: `demo-${Date.now()}`,
        isMock: true,
        createdAt: new Date().toISOString()
      };
      if (wantsStream) {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(sseChunk('complete', { result: mockData }));
            controller.close();
          }
        });
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive'
          }
        });
      }
      return NextResponse.json(mockData);
    }

    if (!effectiveGeminiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY не настроен. Пожалуйста, укажите ключ в файле .env.local.' },
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
    let cachedSttPromise: Promise<{ text: string; segments: TranscriptItem[] }> | undefined = undefined;

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
          cachedSttPromise = cached.sttPromise;
        }
        removeUpload(uploadId);
      }
    } else if (blobUrl) {
      // Download directly from Vercel Blob into memory
      try {
        const blobRes = await fetch(blobUrl);
        if (blobRes.ok) {
          audioBuffer = Buffer.from(await blobRes.arrayBuffer());
          fileSize = audioBuffer.length;
          mimeType = blobRes.headers.get('content-type') || '';
          try {
            const parsedUrl = new URL(blobUrl);
            fileName = decodeURIComponent(parsedUrl.pathname.split('/').pop() || 'audio');
          } catch {
            fileName = 'audio';
          }
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
      } catch (err) {
        console.error('[Process] Error fetching Vercel Blob:', err);
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

    // ==========================================
    // STREAMING SSE HANDLER
    // ==========================================
    if (wantsStream) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(sseChunk('step', { step: 1, message: 'Подготовка исходного материала...' }));

            let rawTranscript = '';
            let transcriptSegments: TranscriptItem[] = [];
            let geminiResult;

            // Scenario 1: Media file
            if (audioBuffer && audioBuffer.length > 0) {
              let groqSuccess = false;
              if (precomputedStt) {
                transcriptSegments = precomputedStt.segments;
                rawTranscript = transcriptSegments.length > 0
                  ? transcriptSegments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n')
                  : precomputedStt.text;
                groqSuccess = true;
              } else if (cachedSttPromise) {
                try {
                  controller.enqueue(sseChunk('step', { step: 1, message: 'Завершение быстрой транскрибации речи...' }));
                  const sttResult = await withTimeout(cachedSttPromise, 60000, 'Pre-STT timeout');
                  transcriptSegments = sttResult.segments;
                  rawTranscript = transcriptSegments.length > 0
                    ? transcriptSegments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n')
                    : sttResult.text;
                  groqSuccess = true;
                } catch (e) {
                  const msg = e instanceof Error ? e.message : String(e);
                  console.warn('[Process] Precomputed STT skipped (' + msg + '), proceeding to Gemini multimodal pipeline...');
                }
              }

              // Запускаем Groq только если файл не отправлялся на пред-транскрибацию ранее
              // Groq нативно поддерживает mp3, mp4, mpeg, mpga, m4a, wav, webm до 25 МБ
              const isGroqFormat =
                mimeType.startsWith('audio/') ||
                mimeType.includes('mp4') ||
                mimeType.includes('webm') ||
                mimeType.includes('mpeg') ||
                /\.(mp3|mp4|mpeg|mpga|m4a|wav|webm|ogg)$/i.test(fileName || '');

              if (!groqSuccess && !cachedSttPromise && effectiveGroqKey && fileSize <= 24 * 1024 * 1024 && isGroqFormat) {
                try {
                  controller.enqueue(sseChunk('step', { step: 1, message: 'Быстрая транскрибация речи через Groq...' }));
                  const sttResult = await withTimeout(
                    transcribeWithGroq(audioBuffer, effectiveGroqKey, fileName || 'audio.wav', mimeType),
                    60000,
                    'Groq timeout'
                  );
                  transcriptSegments = sttResult.segments;
                  rawTranscript = transcriptSegments.length > 0
                    ? transcriptSegments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n')
                    : sttResult.text;
                  groqSuccess = true;
                } catch (groqErr) {
                  const msg = groqErr instanceof Error ? groqErr.message : String(groqErr);
                  console.warn('[Process Stream] Groq STT fallback to Gemini directly (' + msg + ')');
                }
              }

              controller.enqueue(sseChunk('step', { step: 2, message: 'Анализ фактов и генерация черновика...' }));

              if (groqSuccess && rawTranscript) {
                geminiResult = await processWithGeminiStream(
                  rawTranscript,
                  {
                    onFact: async (fact: FactCheckItem) => {
                      const enriched = await enrichFactSource(fact, fact.speaker, undefined, effectiveGeminiKey);
                      controller.enqueue(sseChunk('fact', { fact: enriched }));
                    },
                    onDraftChunk: (chunk: string) => controller.enqueue(sseChunk('draft_chunk', { chunk }))
                  },
                  effectiveGeminiKey,
                  undefined,
                  fileName
                );
              } else {
                geminiResult = await processAudioWithGeminiStream(
                  audioBuffer,
                  mimeType,
                  {
                    onFact: async (fact: FactCheckItem) => {
                      const enriched = await enrichFactSource(fact, fact.speaker, undefined, effectiveGeminiKey);
                      controller.enqueue(sseChunk('fact', { fact: enriched }));
                    },
                    onDraftChunk: (chunk: string) => controller.enqueue(sseChunk('draft_chunk', { chunk }))
                  },
                  effectiveGeminiKey,
                  undefined,
                  fileName
                );
                if (geminiResult.transcript && geminiResult.transcript.length > 0) {
                  transcriptSegments = geminiResult.transcript;
                  rawTranscript = transcriptSegments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n');
                } else {
                  rawTranscript = geminiResult.outputs.ru?.web_article || 'Транскрипт сформирован';
                }
              }
            } else if (sourceText.trim()) {
              // Scenario 2: Text input
              controller.enqueue(sseChunk('step', { step: 2, message: 'Проверка утверждений и создание черновика...' }));

              geminiResult = await processWithGeminiStream(
                sourceText,
                {
                  onFact: async (fact: FactCheckItem) => {
                    const enriched = await enrichFactSource(fact, fact.speaker, undefined, effectiveGeminiKey);
                    controller.enqueue(sseChunk('fact', { fact: enriched }));
                  },
                  onDraftChunk: (chunk: string) => controller.enqueue(sseChunk('draft_chunk', { chunk }))
                },
                effectiveGeminiKey
              );

              const lines = sourceText.split('\n').filter(l => l.trim().length > 0);
              const mainSpeaker = geminiResult.factCheckItems[0]?.speaker || 'Эксперт';
              transcriptSegments = lines.map((line, idx) => {
                const timeMatch = line.match(/^\[?(\d{2}:\d{2})\]?/);
                const timestamp = timeMatch ? timeMatch[1] : `00:${(idx * 15).toString().padStart(2, '0')}`;
                const cleanText = line.replace(/^\[?\d{2}:\d{2}\]?\s*/, '').trim();
                return {
                  id: `t-${idx + 1}`,
                  timestamp,
                  speaker: idx % 2 === 0 ? mainSpeaker : 'Интервьюер',
                  text: cleanText,
                  flagIds: []
                };
              });
              rawTranscript = sourceText;
            } else {
              throw new Error('Не предоставлен файл или текст для обработки');
            }

            const processingTime = (Date.now() - startTime) / 1000;

            const enrichedFacts = await Promise.all(
              geminiResult.factCheckItems.map(item => enrichFactSource(item, item.speaker, undefined, effectiveGeminiKey))
            );

            const responseData: PipelineResult = {
              id: `result-${Date.now()}`,
              title: geminiResult.title || fileName || 'Редакционный материал',
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
              factCheckItems: enrichedFacts,
              outputs: geminiResult.outputs,
              isMock: false,
              createdAt: new Date().toISOString(),
              stats: {
                audioLength: fileSize > 0 ? `${Math.round(fileSize / 1024 / 10)}s` : undefined,
                wordCount: rawTranscript.split(/\s+/).filter(Boolean).length,
                totalFlags: geminiResult.factCheckItems.length,
                verifiedFlags: 0,
                processingTimeSec: Number(processingTime.toFixed(1))
              }
            };

            controller.enqueue(sseChunk('complete', { result: responseData }));
            controller.close();
          } catch (err) {
            console.error('[Stream Error]:', err);
            controller.enqueue(
              sseChunk('error', {
                error: err instanceof Error ? err.message : 'Ошибка обработки материала'
              })
            );
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      });
    }

    // ==========================================
    // NON-STREAMING FALLBACK (Standard JSON)
    // ==========================================
    if (audioBuffer && audioBuffer.length > 0) {
      let rawTranscript = '';
      let transcriptSegments: TranscriptItem[] = [];
      let geminiResult;
      let groqSuccess = false;

      if (precomputedStt) {
        transcriptSegments = precomputedStt.segments;
        rawTranscript = transcriptSegments.length > 0
          ? transcriptSegments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n')
          : precomputedStt.text;
        groqSuccess = true;
      } else if (
        effectiveGroqKey &&
        fileSize <= 24 * 1024 * 1024 &&
        (mimeType.startsWith('audio/') ||
          mimeType.includes('mp4') ||
          mimeType.includes('webm') ||
          mimeType.includes('mpeg') ||
          /\.(mp3|mp4|mpeg|mpga|m4a|wav|webm|ogg)$/i.test(fileName || ''))
      ) {
        try {
          const sttResult = await withTimeout(
            transcribeWithGroq(audioBuffer, effectiveGroqKey, fileName || 'audio.wav', mimeType),
            60000,
            'Groq timeout'
          );
          transcriptSegments = sttResult.segments;
          rawTranscript = transcriptSegments.length > 0
            ? transcriptSegments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n')
            : sttResult.text;
          groqSuccess = true;
        } catch (groqErr) {
          const msg = groqErr instanceof Error ? groqErr.message : String(groqErr);
          console.warn('[Audio Pipeline] Groq STT fallback to Gemini (' + msg + ')');
        }
      }

      if (groqSuccess && rawTranscript) {
        geminiResult = await processWithGemini(rawTranscript, effectiveGeminiKey, undefined, fileName);
      } else {
        geminiResult = await processAudioWithGemini(audioBuffer, mimeType, effectiveGeminiKey, undefined, fileName);
        if (geminiResult.transcript && geminiResult.transcript.length > 0) {
          transcriptSegments = geminiResult.transcript;
          rawTranscript = transcriptSegments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n');
        } else {
          rawTranscript = geminiResult.outputs.ru?.web_article || 'Транскрипт сформирован';
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;

      const enrichedFacts = await Promise.all(
        geminiResult.factCheckItems.map(item => enrichFactSource(item, item.speaker, undefined, effectiveGeminiKey))
      );

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
        factCheckItems: enrichedFacts,
        outputs: geminiResult.outputs,
        isMock: false,
        createdAt: new Date().toISOString(),
        stats: {
          audioLength: `${Math.round(fileSize / 1024 / 10)}s`,
          wordCount: rawTranscript.split(/\s+/).filter(Boolean).length,
          totalFlags: geminiResult.factCheckItems.length,
          verifiedFlags: 0,
          processingTimeSec: Number(processingTime.toFixed(1))
        }
      };

      return NextResponse.json(responseData);
    }

    if (sourceText.trim()) {
      const geminiResult = await processWithGemini(sourceText, effectiveGeminiKey);
      const lines = sourceText.split('\n').filter(l => l.trim().length > 0);
      const mainSpeaker = geminiResult.factCheckItems[0]?.speaker || 'Эксперт';
      const transcriptSegments: TranscriptItem[] = lines.map((line, idx) => {
        const timeMatch = line.match(/^\[?(\d{2}:\d{2})\]?/);
        const timestamp = timeMatch ? timeMatch[1] : `00:${(idx * 15).toString().padStart(2, '0')}`;
        const cleanText = line.replace(/^\[?\d{2}:\d{2}\]?\s*/, '').trim();
        return {
          id: `t-${idx + 1}`,
          timestamp,
          speaker: idx % 2 === 0 ? mainSpeaker : 'Интервьюер',
          text: cleanText,
          flagIds: []
        };
      });

      const processingTime = (Date.now() - startTime) / 1000;

      const enrichedFacts = await Promise.all(
        geminiResult.factCheckItems.map(item => enrichFactSource(item, item.speaker, undefined, effectiveGeminiKey))
      );

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
        factCheckItems: enrichedFacts,
        outputs: geminiResult.outputs,
        isMock: false,
        createdAt: new Date().toISOString(),
        stats: {
          wordCount: sourceText.split(/\s+/).filter(Boolean).length,
          totalFlags: geminiResult.factCheckItems.length,
          verifiedFlags: 0,
          processingTimeSec: Number(processingTime.toFixed(1))
        }
      };

      return NextResponse.json(responseData);
    }

    return NextResponse.json({ error: 'Не предоставлен файл или текст' }, { status: 400 });
  } catch (error) {
    console.error('[Process Route Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
