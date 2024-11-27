import type { 
  Recording, 
  Transcription, 
  TranscriptionProgress,
  TranscriptionSegment 
} from '../../shared/types';

interface TranscriptionRequest {
  recordingId: string;
  filePath: string;
  language?: string;
}

export interface ElectronAPI {
  // Settings methods
  getSettings: () => Promise<Array<{ key: string; value: string }>>;
  saveSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  
  // Audio file methods
  getAudioFiles: () => Promise<Recording[]>;
  addAudioFile: (filePath: string) => Promise<string>;
  
  // Transcription methods
  startTranscription: (request: TranscriptionRequest) => Promise<{ success: boolean }>;
  cancelTranscription: (recordingId: string) => Promise<{ success: boolean }>;
  getTranscriptionStatus: (recordingId: string) => Promise<{
    status: 'pending' | 'processing' | 'completed' | 'error';
    error?: string;
  }>;
  getTranscription: (recordingId: string) => Promise<Transcription | null>;
  getTranscriptionProgress: (recordingId: string) => Promise<TranscriptionProgress>;
  
  // Event system
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}