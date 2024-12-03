// src/main/transcription/worker.ts
import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { FileSystemEvents, EVENT_TYPES } from '../file-system/events';
import { 
  TranscriptionProgress, 
  TranscriptionSegment, 
  Transcription,
  TranscriptionError 
} from '../../shared/types';

export interface TranscriptionRequest {
  recordingId: string;
  filePath: string;
  language?: string;
}

interface WorkerMessage {
  type: 'progress' | 'result' | 'error';
  progress?: number;
  data?: Transcription;
  error?: string;
}

export class TranscriptionWorker {
  private worker: Worker | null = null;
  private events: FileSystemEvents;
  private readonly modelPath: string;

  constructor() {
    this.events = FileSystemEvents.getInstance();
    this.modelPath = path.join(__dirname, '../../deps/whisper.cpp/models/ggml-medium.en.bin');
    
    // Validate model exists during initialization
    if (!fs.existsSync(this.modelPath)) {
      throw new Error('Whisper model not found');
    }
  }

  private validateRequest(request: TranscriptionRequest): void {
    if (!request.recordingId) {
      throw new Error('Recording ID is required');
    }
    if (!request.filePath) {
      throw new Error('File path is required');
    }
    if (!fs.existsSync(request.filePath)) {
      throw new Error('Audio file not found');
    }
  }

  async transcribe(request: TranscriptionRequest): Promise<Transcription> {
    try {
      // Validate request parameters
      this.validateRequest(request);

      const workerScript = path.join(__dirname, 'whisper-worker.js');
      if (!fs.existsSync(workerScript)) {
        throw new Error('Worker script not found');
      }

      return await new Promise<Transcription>((resolve, reject) => {
        this.worker = new Worker(workerScript, {
          workerData: {
            modelPath: this.modelPath,
            filePath: request.filePath,
            language: request.language || 'en'
          }
        });

        // Handle worker messages
        this.worker.on('message', (message: WorkerMessage) => {
          switch (message.type) {
            case 'progress':
              if (typeof message.progress === 'number') {
                this.events.emit(EVENT_TYPES.TRANSCRIPTION_PROGRESS, {
                  recording_id: request.recordingId,
                  percent_complete: message.progress,
                  current_segment: null,
                  estimated_time_remaining: null
                });
              }
              break;

            case 'result':
              if (message.data) {
                resolve(message.data);
              } else {
                reject(new TranscriptionError('No transcription data received'));
              }
              break;

            case 'error':
              reject(new TranscriptionError(message.error || 'Unknown error occurred'));
              break;

            default:
              console.warn('Unknown message type received from worker:', message);
          }
        });

        // Handle worker errors
        this.worker.on('error', (error: Error) => {
          reject(new TranscriptionError(`Worker error: ${error.message}`));
        });

        // Handle worker exit
        this.worker.on('exit', (code: number) => {
          if (code !== 0) {
            reject(new TranscriptionError(`Worker stopped with exit code ${code}`));
          }
          this.worker = null;
        });

        // Set up cleanup on process exit
        process.once('exit', () => {
          this.terminate();
        });

      }).finally(() => {
        // Clean up worker if it's still running
        this.terminate();
      });

    } catch (error) {
      throw error instanceof TranscriptionError 
        ? error 
        : new TranscriptionError(`Transcription failed: ${error.message}`);
    }
  }

  terminate(): void {
    if (this.worker) {
      try {
        // Send termination message to worker before terminating
        this.worker.postMessage('terminate');
        // Give the worker a chance to clean up
        setTimeout(() => {
          if (this.worker) {
            this.worker.terminate();
            this.worker = null;
          }
        }, 100);
      } catch (error) {
        console.error('Error terminating worker:', error);
        // Force terminate if clean shutdown fails
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
        }
      }
    }
  }
}