import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/constants/ipc';
import type { 
  Recording, 
  Transcription, 
  TranscriptionProgress,
  TranscriptionError 
} from '../shared/types';

// Define the electron API interface
export interface ElectronAPI {
  // Settings methods
  getSettings: () => Promise<Array<{ key: string; value: string }>>;
  saveSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  
  // Audio file methods
  getAudioFiles: () => Promise<Recording[]>;
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
  
  getTranscription: (recordingId: string) => Promise<Transcription | null>;
  
  getTranscriptionProgress: (recordingId: string) => Promise<TranscriptionProgress>;
  
  // Event system
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

// Expose the typed API to the renderer process
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
  startTranscription: (request) => 
    ipcRenderer.invoke(IpcChannels.START_TRANSCRIPTION, request),
  cancelTranscription: (recordingId) => 
    ipcRenderer.invoke(IpcChannels.CANCEL_TRANSCRIPTION, recordingId),
  getTranscriptionStatus: (recordingId) => 
    ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_STATUS, recordingId),
  getTranscription: (recordingId) => 
    ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION, recordingId),
  getTranscriptionProgress: (recordingId) => 
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
    electron: ElectronAPI;
  }
}