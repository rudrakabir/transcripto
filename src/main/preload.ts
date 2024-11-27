import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/constants/ipc';

contextBridge.exposeInMainWorld('electron', {
  // Settings methods
  getSettings: () => ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
  saveSetting: (key: string, value: string) => 
    ipcRenderer.invoke(IpcChannels.SAVE_SETTING, key, value),
    
  // Audio file methods
  getAudioFiles: () => ipcRenderer.invoke(IpcChannels.GET_AUDIO_FILES),
  addAudioFile: (filePath: string) => 
    ipcRenderer.invoke(IpcChannels.ADD_AUDIO_FILE, filePath),
  
  // Transcription methods
  startTranscription: (request: {
    recordingId: string;
    filePath: string;
    language?: string;
  }) => ipcRenderer.invoke(IpcChannels.START_TRANSCRIPTION, request),
  cancelTranscription: (recordingId: string) => 
    ipcRenderer.invoke(IpcChannels.CANCEL_TRANSCRIPTION, recordingId),
  getTranscriptionStatus: (recordingId: string) => 
    ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_STATUS, recordingId),
  getTranscription: (recordingId: string) => 
    ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION, recordingId),
  getTranscriptionProgress: (recordingId: string) => 
    ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_PROGRESS, recordingId),

  // Event system
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  }
});

// Add types for TypeScript
declare global {
  interface Window {
    electron: {
      // Settings methods
      getSettings: () => Promise<any[]>;
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
}