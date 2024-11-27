// src/main/transcription/worker.ts
import { Worker, WorkerOptions } from 'worker_threads';
import path from 'path';
import { FileSystemEvents, EVENT_TYPES } from '../file-system/events';

export interface TranscriptionRequest {
  recordingId: string;
  filePath: string;
  language?: string;
}

export interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export class TranscriptionWorker {
  private worker: Worker | null = null;
  private events: FileSystemEvents;

  constructor() {
    this.events = FileSystemEvents.getInstance();
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      const workerScript = path.join(__dirname, 'whisper-worker.js');
      
      this.worker = new Worker(workerScript, {
        workerData: {
          modelPath: path.join(__dirname, '../../deps/whisper.cpp/models/ggml-medium.en.bin'),
          filePath: request.filePath,
          language: request.language || 'en'
        }
      });

      this.worker.on('message', (result) => {
        if (result.type === 'progress') {
          this.events.emit(EVENT_TYPES.TRANSCRIPTION_PROGRESS, {
            recordingId: request.recordingId,
            progress: result.progress
          });
        } else if (result.type === 'result') {
          resolve(result.data);
        }
      });

      this.worker.on('error', reject);
      this.worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}