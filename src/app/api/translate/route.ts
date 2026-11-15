import { NextRequest, NextResponse } from 'next/server';
import { translateEditorialPackage } from '@/lib/gemini';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      article,
      telegram,
      scenario,
      targetPhrases = [],
      targetFixes = [],
      facts = [],
      targetLang = 'kz',
      geminiKey
    } = body;

    if (!article || !targetLang) {
      return NextResponse.json(
        { error: 'Article text and targetLang are required' },
        { status: 400 }
      );
    }

    const effectiveKey = geminiKey || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const result = await translateEditorialPackage(
      article,
      telegram || '',
      scenario || '',
      targetPhrases,
      targetFixes,
      targetLang as 'kz' | 'en',
      effectiveKey,
      facts
    );

    return NextResponse.json({
      success: true,
      targetLang,
      outputs: result.outputs,
      translatedPhrases: result.translatedPhrases,
      translatedFixes: result.translatedFixes,
      translatedFacts: result.translatedFacts
    });
  } catch (error) {
    console.error('[Translate Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}

