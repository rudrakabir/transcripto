import { EventEmitter } from 'events';
import { z } from 'zod';
import type { Simplify } from 'type-fest';

// ============================================================================
// Constants & Enums
// ============================================================================

export enum RecordingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export const CONFIG = {
  SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'ko', 'zh'] as const,
  MAX_FILE_SIZE: 1024 * 1024 * 1024, // 1GB
  SUPPORTED_FORMATS: ['.mp3', '.wav', '.m4a', '.ogg'] as const,
} as const;

// ============================================================================
// Base Types & Interfaces
// ============================================================================

export interface RecordingMetadata {
  format: string;
  bitrate: number;
  channels: number;
  sample_rate: number;
  codec: string;
  tags?: Record<string, string>;
}

export interface TranscriptionSegment {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
  speaker_id?: string;
}

export interface TranscriptionProgress {
  recording_id: string;
  percent_complete: number;
  current_segment?: TranscriptionSegment;
  estimated_time_remaining?: number;
}

export interface TranscriptionError {
  recording_id: string;
  error_code: string;
  error_message: string;
  timestamp: number;
}

export interface Recording {
  id: string;
  filepath: string;
  filename: string;
  filesize: number;
  duration: number;
  created_at: number;
  modified_at: number;
  status: RecordingStatus;
  error_message?: string;
  metadata: RecordingMetadata;
}

export interface Transcription {
  id: string;
  recording_id: string;
  content: string;
  language: string;
  confidence: number;
  segments: TranscriptionSegment[];
  created_at: number;
  modified_at: number;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const recordingMetadataSchema = z.object({
  format: z.string(),
  bitrate: z.number().positive(),
  channels: z.number().int().positive(),
  sample_rate: z.number().positive(),
  codec: z.string(),
  tags: z.record(z.string()).optional(),
});

export const recordingSchema = z.object({
  id: z.string().uuid(),
  filepath: z.string(),
  filename: z.string(),
  filesize: z.number().positive().max(CONFIG.MAX_FILE_SIZE),
  duration: z.number().positive(),
  created_at: z.number(),
  modified_at: z.number(),
  status: z.nativeEnum(RecordingStatus),
  error_message: z.string().optional(),
  metadata: recordingMetadataSchema,
});

export const transcriptionSegmentSchema = z.object({
  id: z.string(),
  start_time: z.number().min(0),
  end_time: z.number().min(0),
  text: z.string(),
  confidence: z.number().min(0).max(1),
  speaker_id: z.string().optional(),
});

export const transcriptionSchema = z.object({
  id: z.string().uuid(),
  recording_id: z.string().uuid(),
  content: z.string(),
  language: z.enum(CONFIG.SUPPORTED_LANGUAGES),
  confidence: z.number().min(0).max(1),
  segments: z.array(transcriptionSegmentSchema),
  created_at: z.number(),
  modified_at: z.number(),
});

// ============================================================================
// Event System
// ============================================================================

export interface EventDefinitions {
  'recording:added': Recording;
  'recording:updated': Recording;
  'recording:deleted': string; // recording_id
  'transcription:started': string; // recording_id
  'transcription:progress': TranscriptionProgress;
  'transcription:completed': Transcription;
  'transcription:error': TranscriptionError;
}

export class TypedEventEmitter<T extends Record<string, any>> {
  private emitter = new EventEmitter();

  on<K extends keyof T>(event: K, listener: (payload: T[K]) => void): void {
    this.emitter.on(event as string, listener);
  }

  off<K extends keyof T>(event: K, listener: (payload: T[K]) => void): void {
    this.emitter.off(event as string, listener);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.emitter.emit(event as string, payload);
  }

  once<K extends keyof T>(event: K, listener: (payload: T[K]) => void): void {
    this.emitter.once(event as string, listener);
  }
}

export const eventBus = new TypedEventEmitter<EventDefinitions>();

// ============================================================================
// Utility Functions
// ============================================================================

export const utils = {
  validateRecording: (recording: unknown): Recording => {
    return recordingSchema.parse(recording);
  },

  validateTranscription: (transcription: unknown): Transcription => {
    return transcriptionSchema.parse(transcription);
  },

  isValidAudioFormat: (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return CONFIG.SUPPORTED_FORMATS.includes(`.${ext}` as typeof CONFIG.SUPPORTED_FORMATS[number]);
  },

  calculateProgress: (completed: number, total: number): number => {
    return Math.min(Math.round((completed / total) * 100), 100);
  },

  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return [
      hours > 0 ? hours.toString().padStart(2, '0') : null,
      minutes.toString().padStart(2, '0'),
      remainingSeconds.toString().padStart(2, '0')
    ]
      .filter(Boolean)
      .join(':');
  },

  createTimestamp: (): number => {
    return Date.now();
  },
} as const;