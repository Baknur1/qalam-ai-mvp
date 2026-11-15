import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/x-wav',
            'audio/m4a',
            'audio/x-m4a',
            'audio/mp4',
            'audio/webm',
            'audio/ogg',
            'video/mp4',
            'video/webm',
            'video/quicktime'
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
          tokenPayload: JSON.stringify({ pathname })
        };
      },
      onUploadCompleted: async () => {
        // Callback when file upload finishes
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('[Vercel Blob Upload Route Error]:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}


