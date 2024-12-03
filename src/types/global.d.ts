import type { Recording, Transcription, TranscriptionProgress, RecordingStatus } from '../shared/types';

export interface ElectronAPI {
  // Settings methods
  getSettings: () => Promise<Array<{ key: string; value: string }>>;
  saveSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  
  // Audio file methods
  getAudioFiles: () => Promise<Recording[]>;
  getRecording: (id: string) => Promise<Recording | null>;
  addAudioFile: (recording: Recording) => Promise<string>;
  updateRecordingStatus: (
    id: string, 
    status: RecordingStatus, 
    error?: string
  ) => Promise<{ success: boolean }>;
  
  // File system methods
  selectDirectory: () => Promise<string>;
  selectFile: () => Promise<string>;
  
  // Transcription methods
  startTranscription: (request: {
    recordingId: string;
    filePath: string;
    language?: string;
  }) => Promise<{ success: boolean }>;
  
  cancelTranscription: (recordingId: string) => Promise<{ success: boolean }>;
  
  getTranscription: (recordingId: string) => Promise<Transcription | null>;
  
  saveTranscription: (transcription: Transcription) => Promise<{ success: boolean }>;
  
  getTranscriptionStatus: (recordingId: string) => Promise<{
    status: string;
    error?: string;
  }>;
  
  getTranscriptionProgress: (recordingId: string) => Promise<TranscriptionProgress>;
  
  // Event system
  on: <T>(channel: string, callback: (event: any, ...args: T[]) => void) => void;
  removeListener: <T>(channel: string, callback: (event: any, ...args: T[]) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<string | Uint8Array>;
      writeFile: (path: string, data: string | Buffer) => Promise<void>;
    };
  }
}