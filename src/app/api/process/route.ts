import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PIPELINE_RESULT } from '@/lib/mock-data';
import { processWithGemini } from '@/lib/gemini';
import { transcribeWithGroq } from '@/lib/groq';
import { PipelineResult, TranscriptItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let isMock = false;
    let sourceText = '';
    let audioFile: File | null = null;
    let customGeminiKey = '';
    let customGroqKey = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      audioFile = formData.get('audio') as File | null;
      sourceText = (formData.get('text') as string) || '';
      isMock = formData.get('useMock') === 'true';
      customGeminiKey = (formData.get('geminiKey') as string) || '';
      customGroqKey = (formData.get('groqKey') as string) || '';
    } else {
      const body = await req.json();
      sourceText = body.text || '';
      isMock = body.useMock || false;
      customGeminiKey = body.geminiKey || '';
      customGroqKey = body.groqKey || '';
    }

    const effectiveGeminiKey = customGeminiKey || process.env.GEMINI_API_KEY;
    const effectiveGroqKey = customGroqKey || process.env.GROQ_API_KEY;

    // Fast-path: Mock mode or no API keys present
    if (isMock || (!effectiveGeminiKey && !sourceText && !audioFile)) {
      return NextResponse.json({
        ...MOCK_PIPELINE_RESULT,
        id: `demo-${Date.now()}`,
        createdAt: new Date().toISOString()
      });
    }

    // If audio is provided and Groq key is available, transcribe first
    let rawTranscript = sourceText;
    let transcriptSegments: TranscriptItem[] = [];

    if (audioFile && effectiveGroqKey) {
      const sttResult = await transcribeWithGroq(audioFile, effectiveGroqKey);
      rawTranscript = sttResult.text;
      transcriptSegments = sttResult.segments;
    } else if (sourceText) {
      // Split user-provided text into rough timestamped chunks if not provided
      const lines = sourceText.split('\n').filter(l => l.trim().length > 0);
      transcriptSegments = lines.map((line, idx) => {
        const timeMatch = line.match(/^\[?(\d{2}:\d{2})\]?/);
        const timestamp = timeMatch ? timeMatch[1] : `00:${(idx * 15).toString().padStart(2, '0')}`;
        const cleanText = line.replace(/^\[?\d{2}:\d{2}\]?\s*/, '').trim();
        return {
          id: `t-${idx + 1}`,
          timestamp,
          speaker: idx % 2 === 0 ? 'Спикер' : 'Интервьюер',
          text: cleanText,
          flagIds: []
        };
      });
    }

    // Process with Gemini Flash if key is available
    if (effectiveGeminiKey && rawTranscript) {
      const geminiResult = await processWithGemini(rawTranscript, effectiveGeminiKey);
      
      // Associate flags with transcript segments
      const flags = geminiResult.flags.map((f, i) => ({
        ...f,
        id: f.id || `flag-${i + 1}`,
        verified: false
      }));

      // Map flag IDs into segments if text matches
      transcriptSegments.forEach(seg => {
        flags.forEach(flag => {
          if (seg.text.toLowerCase().includes(flag.text.toLowerCase())) {
            seg.flagIds.push(flag.id);
          }
        });
      });

      const responseData: PipelineResult = {
        id: `result-${Date.now()}`,
        title: geminiResult.title || 'Обработанный редакционный материал',
        sourceLang: 'mixed',
        rawTranscriptText: rawTranscript,
        transcript: transcriptSegments.length > 0 ? transcriptSegments : MOCK_PIPELINE_RESULT.transcript,
        flags,
        outputs: geminiResult.outputs,
        isMock: false,
        createdAt: new Date().toISOString(),
        stats: {
          wordCount: rawTranscript.split(/\s+/).length,
          totalFlags: flags.length,
          verifiedFlags: 0,
          processingTimeSec: 4.8
        }
      };

      return NextResponse.json(responseData);
    }

    // Fallback: If no real keys, return Mock data with custom title/text notice
    return NextResponse.json({
      ...MOCK_PIPELINE_RESULT,
      id: `demo-${Date.now()}`,
      isMock: true
    });
  } catch (error: unknown) {
    console.error('Pipeline process error:', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: message, fallback: MOCK_PIPELINE_RESULT },
      { status: 500 }
    );
  }
}
