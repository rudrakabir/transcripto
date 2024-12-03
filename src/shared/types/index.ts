// src/shared/types/index.ts

export enum RecordingStatus {
  UNPROCESSED = 'unprocessed',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface Recording {
  id: string;
  path: string;
  fileName: string;
  size: number;
  duration?: number;
  createdAt: Date;
  modifiedAt: Date;
  transcriptionStatus: RecordingStatus;
  transcriptionError?: string;
  transcription?: string;
  watchFolder: string;
  format?: string;
  bitrate?: number;
  channels?: number;
  sampleRate?: number;
  lastAccessed?: Date;
  metadata?: Record<string, any>;
}

export interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
  speaker?: string;
}

export interface Transcription {
  id: string;
  recordingId: string;
  language: string;
  segments: TranscriptionSegment[];
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptionProgress {
  recording_id: string;
  percent_complete: number;
  current_segment?: TranscriptionSegment;
  estimated_time_remaining?: number;
}

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}