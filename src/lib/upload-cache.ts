import fs from 'fs';
import path from 'path';
import os from 'os';
import { TranscriptItem } from './types';

export interface CachedUpload {
  id: string;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  size: number;
  createdAt: number;
  sttPromise?: Promise<{ text: string; segments: TranscriptItem[] }>;
  sttResult?: { text: string; segments: TranscriptItem[] };
}

// In-memory store
const uploadStore = new Map<string, CachedUpload>();

const TEMP_DIR = path.join(os.tmpdir(), 'n-project-uploads');

// Ensure temp dir exists
try {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
} catch {
  // Ignore
}

// Clean up uploads older than 30 minutes
const TTL_MS = 30 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [id, item] of uploadStore.entries()) {
    if (now - item.createdAt > TTL_MS) {
      uploadStore.delete(id);
      try {
        const filePath = path.join(TEMP_DIR, `${id}.bin`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // Ignore file cleanup error
      }
    }
  }
}

export function saveUpload(data: {
  id: string;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  size: number;
  sttPromise?: Promise<{ text: string; segments: TranscriptItem[] }>;
}): void {
  cleanup();

  const item: CachedUpload = {
    ...data,
    createdAt: Date.now()
  };

  uploadStore.set(data.id, item);

  // If sttPromise exists, attach resolution to sttResult
  if (data.sttPromise) {
    data.sttPromise
      .then((res) => {
        const current = uploadStore.get(data.id);
        if (current) {
          current.sttResult = res;
        }
      })
      .catch((err) => {
        console.warn(`[Upload Cache] Pre-transcription for ${data.id} failed:`, err);
      });
  }

  // Backup to disk in case memory is constrained
  try {
    const filePath = path.join(TEMP_DIR, `${data.id}.bin`);
    fs.writeFileSync(filePath, data.buffer);
  } catch (err) {
    console.warn('[Upload Cache] Failed to write backup file to disk:', err);
  }
}

export function getUpload(id: string): CachedUpload | undefined {
  cleanup();
  let item = uploadStore.get(id);

  if (!item) {
    // Check disk backup
    try {
      const filePath = path.join(TEMP_DIR, `${id}.bin`);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        item = {
          id,
          buffer,
          mimeType: 'audio/wav',
          fileName: 'preuploaded_audio.wav',
          size: buffer.length,
          createdAt: Date.now()
        };
        uploadStore.set(id, item);
      }
    } catch {
      // Ignore
    }
  }

  return item;
}

export function removeUpload(id: string): void {
  uploadStore.delete(id);
  try {
    const filePath = path.join(TEMP_DIR, `${id}.bin`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore
  }
}

