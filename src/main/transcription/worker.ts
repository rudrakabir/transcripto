// src/main/transcription/worker.ts
import { Worker } from 'worker_threads';
import path from 'path';
import { FileSystemEvents, EVENT_TYPES } from '../file-system/events';
import { 
  TranscriptionProgress, 
  TranscriptionSegment, 
  Transcription 
} from '../../shared/types';

export interface TranscriptionRequest {
  recordingId: string;
  filePath: string;
  language?: string;
}

interface WorkerMessage {
  type: 'progress' | 'result';
  data: TranscriptionProgress | Transcription;
}

export class TranscriptionWorker {
  private worker: Worker | null = null;
  private events: FileSystemEvents;

  constructor() {
    this.events = FileSystemEvents.getInstance();
  }

  async transcribe(request: TranscriptionRequest): Promise<Transcription> {
    return new Promise((resolve, reject) => {
      const workerScript = path.join(__dirname, 'whisper-worker.js');
      
      this.worker = new Worker(workerScript, {
        workerData: {
          modelPath: path.join(__dirname, '../../deps/whisper.cpp/models/ggml-medium.en.bin'),
          filePath: request.filePath,
          language: request.language || 'en'
        }
      });

      this.worker.on('message', (message: WorkerMessage) => {
        if (message.type === 'progress') {
          const progress = message.data as TranscriptionProgress;
          this.events.emit(EVENT_TYPES.TRANSCRIPTION_PROGRESS, {
            recording_id: request.recordingId,
            percent_complete: progress.percent_complete,
            current_segment: progress.current_segment,
            estimated_time_remaining: progress.estimated_time_remaining
          });
        } else if (message.type === 'result') {
          resolve(message.data as Transcription);
        }
      });

      this.worker.on('error', (error: Error) => {
        reject(error);
      });

      this.worker.on('exit', (code: number) => {
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