/**
 * Browser-side audio extractor:
 * Extracts the audio track from video files (MP4, MOV, WebM) using the native
 * Web Audio API and encodes it as a lightweight 16kHz mono WAV file.
 * 
 * Benefits:
 * 1. 50-100MB video shrinks to 5-10MB pure speech audio.
 * 2. Fits inside Groq Whisper's 25MB limit for 2-second ultra-fast transcription.
 * 3. Prevents Gemini 503 Model Overloaded errors caused by processing massive video streams.
 */

export async function extractAudioFromMedia(
  file: File,
  onProgress?: (stage: 'decoding' | 'encoding' | 'ready') => void
): Promise<File> {
  const isVideo =
    file.type.startsWith('video/') ||
    /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name);

  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const isWav = /\.wav$/i.test(file.name);
  const isCompressedAudio = /\.(m4a|mp3|aac|ogg|webm|opus)$/i.test(file.name);

  // M4A, MP3, AAC, OGG уже аппаратно сжаты кодеками AAC/MP3.
  // Конвертация сжатого M4A/MP3 в WAV раздувает размер в 3-5 раз, потому что WAV — это несжатый PCM поток!
  // Поэтому если это уже сжатое аудио < 24 МБ (или < 4.2 МБ на Vercel), не раздуваем его в WAV:
  if (!isVideo && isCompressedAudio) {
    if (!isVercel && file.size <= 24 * 1024 * 1024) return file;
    if (isVercel && file.size <= 4.2 * 1024 * 1024) return file;
  }

  // Если это уже легкий WAV (< 3 МБ), тоже оставляем как есть
  if (!isVideo && isWav && file.size <= 3 * 1024 * 1024) {
    return file;
  }

  // Если это видео, тяжелый WAV или аудиофайл больше лимита — пережимаем в легковесный 16kHz моно-звук
  if (typeof window === 'undefined') {
    return file;
  }

  try {
    onProgress?.('decoding');
    const arrayBuffer = await file.arrayBuffer();

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      console.warn('[AudioExtractor] Web Audio API is not supported in this browser.');
      return file;
    }

    const audioCtx = new AudioContextClass();
    let audioBuffer: AudioBuffer;

    try {
      // slice(0) prevents memory detaching issues across browser engines
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      try {
        await audioCtx.close();
      } catch {
        // Ignore audio context close error
      }
    }

    onProgress?.('encoding');

    // Dynamic target sample rate:
    // На Vercel лимит запроса 4.5 МБ -> целимся в 4.1 МБ.
    // На локале/VPS лимит Groq 25 МБ -> целимся в 20 МБ.
    const maxSafeBytes = isVercel ? 4.1 * 1024 * 1024 : 20 * 1024 * 1024;
    const maxSafeSamples = Math.floor(maxSafeBytes / 2);
    const duration = Math.max(1, audioBuffer.duration);
    const calculatedRate = Math.floor(maxSafeSamples / duration);
    // Clamp between 8000 Hz (стандарт телефонии/речи) и 16000 Hz (нативный оптимум Whisper)
    const targetSampleRate = Math.max(8000, Math.min(16000, calculatedRate));
    const targetLength = Math.ceil(duration * targetSampleRate);

    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWav(renderedBuffer);

    onProgress?.('ready');

    const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');
    const audioFileName = isVideo ? `${cleanBaseName}_audio.wav` : `${cleanBaseName}_opt.wav`;

    return new File([wavBlob], audioFileName, { type: 'audio/wav' });
  } catch (err) {
    console.warn('[AudioExtractor] Client extraction/compression failed, using original file:', err);
    return file;
  }
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob.
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1; // mono
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const channelData = buffer.getChannelData(0);

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = channelData.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF Chunk Descriptor
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');

  // "fmt " Subchunk
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // "data" Subchunk
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

