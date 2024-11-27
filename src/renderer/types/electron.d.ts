interface Window {
  electron: {
    // Settings methods
    getSettings: () => Promise<Array<{ key: string; value: string; }>>;
    saveSetting: (key: string, value: string) => Promise<{ success: boolean }>;
    
    // Audio file methods
    getAudioFiles: () => Promise<Array<{
      id: string;
      name: string;
      path: string;
      createdAt: number;
      status: string;
      filesize: number;
      duration?: number;
      metadata?: any;
    }>>;
    addAudioFile: (filePath: string) => Promise<string>;
    
    // Transcription methods
    startTranscription: (request: {
      recordingId: string;
      filePath: string;
      language?: string;
    }) => Promise<{ success: boolean }>;
    cancelTranscription: (recordingId: string) => Promise<{ success: boolean }>;
    getTranscriptionStatus: (recordingId: string) => Promise<{
      status: string;
      error?: string;
    }>;
    getTranscription: (recordingId: string) => Promise<{
      id: string;
      recordingId: string;
      content: string;
      segments: Array<{
        start: number;
        end: number;
        text: string;
      }>;
      language: string;
      createdAt: number;
      modifiedAt: number;
    } | null>;
    getTranscriptionProgress: (recordingId: string) => Promise<{
      transcriptionStatus: string;
      errorMessage?: string;
    }>;
    
    // Event system
    on: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  }
}