import Groq, { toFile } from 'groq-sdk';
import { TranscriptItem } from './types';

export async function transcribeWithGroq(
  audioInput: File | Blob | Buffer,
  apiKey?: string,
  fileName = 'audio.wav',
  mimeType = 'audio/wav'
): Promise<{ text: string; segments: TranscriptItem[] }> {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const groq = new Groq({
    apiKey: key,
    dangerouslyAllowBrowser: true,
    timeout: 60000,
    maxRetries: 1
  });

  // Use Groq's official toFile helper for rock-solid Node.js binary streaming
  let uploadableFile: unknown;
  if (Buffer.isBuffer(audioInput)) {
    uploadableFile = await toFile(audioInput, fileName, { type: mimeType });
  } else if (audioInput instanceof Blob) {
    const arrayBuf = await audioInput.arrayBuffer();
    const name = ('name' in audioInput && typeof audioInput.name === 'string') ? audioInput.name : fileName;
    uploadableFile = await toFile(Buffer.from(arrayBuf), name, {
      type: audioInput.type || mimeType
    });
  } else {
    uploadableFile = audioInput;
  }

  const transcription = await groq.audio.transcriptions.create({
    file: uploadableFile as never,
    model: 'whisper-large-v3-turbo',
    response_format: 'verbose_json',
    temperature: 0.0,
    prompt: 'Брифинг, интервью на казахском, русском и английском языках, терминология: теңге, министрлік, Астана, Қазақстан.'
  });

  const fullText = transcription.text;
  const segments: TranscriptItem[] = [];

  // @ts-expect-error Groq returns segments when verbose_json is requested
  if (transcription.segments && Array.isArray(transcription.segments)) {
    // @ts-expect-error iterate Groq segments
    transcription.segments.forEach((seg, idx) => {
      const startMin = Math.floor(seg.start / 60).toString().padStart(2, '0');
      const startSec = Math.floor(seg.start % 60).toString().padStart(2, '0');
      segments.push({
        id: `t-${idx + 1}`,
        timestamp: `${startMin}:${startSec}`,
        speaker: `Спикер ${idx % 2 === 0 ? '1' : '2'}`,
        text: seg.text.trim(),
        flagIds: []
      });
    });
  } else {
    // Single chunk fallback
    segments.push({
      id: 't-1',
      timestamp: '00:00',
      speaker: 'Спикер',
      text: fullText,
      flagIds: []
    });
  }

  return {
    text: fullText,
    segments
  };
}
