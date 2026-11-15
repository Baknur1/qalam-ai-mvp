import { NextRequest, NextResponse } from 'next/server';
import { saveUpload } from '@/lib/upload-cache';
import { transcribeWithGroq } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('audio')) as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const uploadId = `upl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let mimeType = file.type || '';
    if (!mimeType) {
      const name = file.name.toLowerCase();
      if (name.endsWith('.wav')) mimeType = 'audio/wav';
      else if (name.endsWith('.mp3')) mimeType = 'audio/mp3';
      else if (name.endsWith('.m4a')) mimeType = 'audio/m4a';
      else if (name.endsWith('.mp4')) mimeType = 'video/mp4';
      else if (name.endsWith('.webm')) mimeType = 'video/webm';
      else mimeType = 'audio/wav';
    }

    // If Groq key is available and file is audio under 24MB, start background transcription immediately
    let sttPromise: Promise<{ text: string; segments: import('@/lib/types').TranscriptItem[] }> | undefined;
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey && file.size <= 24 * 1024 * 1024 && !mimeType.startsWith('video/')) {
      try {
        console.log(`[Pre-Upload] Starting background Groq STT for ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
        sttPromise = transcribeWithGroq(buffer, groqKey, file.name, mimeType);
      } catch (err) {
        console.warn('[Pre-Upload] Failed to initiate background Groq STT:', err);
      }
    }

    saveUpload({
      id: uploadId,
      buffer,
      mimeType,
      fileName: file.name,
      size: file.size,
      sttPromise
    });

    console.log(`[Pre-Upload] File pre-uploaded successfully: ${file.name} (ID: ${uploadId})`);

    return NextResponse.json({
      success: true,
      uploadId,
      fileName: file.name,
      size: file.size,
      mimeType
    });
  } catch (error) {
    console.error('[Pre-Upload Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
