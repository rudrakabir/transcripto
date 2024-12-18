// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/constants/ipc';
import type { 
  Recording, 
  Transcription, 
  TranscriptionProgress,
  RecordingStatus
} from '../shared/types';

type EventCallback<T = unknown> = (event: Electron.IpcRendererEvent, ...args: T[]) => void;

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
  on: <T>(channel: string, callback: EventCallback<T>) => void;
  removeListener: <T>(channel: string, callback: EventCallback<T>) => void;
}

contextBridge.exposeInMainWorld('electron', {
  // Settings methods
  getSettings: () => ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
  saveSetting: (key: string, value: string) => 
    ipcRenderer.invoke(IpcChannels.SAVE_SETTING, key, value),
    
  // Audio file methods
  getAudioFiles: () => ipcRenderer.invoke(IpcChannels.GET_AUDIO_FILES),
  getRecording: (id: string) => ipcRenderer.invoke(IpcChannels.GET_RECORDING, id),
  addAudioFile: (recording: Recording) => 
    ipcRenderer.invoke(IpcChannels.ADD_AUDIO_FILE, recording),
  updateRecordingStatus: (id: string, status: RecordingStatus, error?: string) =>
    ipcRenderer.invoke(IpcChannels.UPDATE_RECORDING_STATUS, id, status, error),
  
  // Transcription methods
  startTranscription: (request) => 
    ipcRenderer.invoke(IpcChannels.START_TRANSCRIPTION, request),
  cancelTranscription: (recordingId) => 
    ipcRenderer.invoke(IpcChannels.CANCEL_TRANSCRIPTION, recordingId),
  getTranscription: (recordingId) => 
    ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION, recordingId),
  saveTranscription: (transcription) =>
    ipcRenderer.invoke(IpcChannels.SAVE_TRANSCRIPTION, transcription),
  getTranscriptionStatus: (recordingId) => 
    ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_STATUS, recordingId),
  getTranscriptionProgress: (recordingId) => 
    ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_PROGRESS, recordingId),

  // Event system
  on: <T>(channel: string, callback: EventCallback<T>) => {
    const wrappedCallback = (event: Electron.IpcRendererEvent, ...args: T[]) => callback(event, ...args);
    ipcRenderer.on(channel, wrappedCallback);
    return wrappedCallback;
  },
  removeListener: <T>(channel: string, callback: EventCallback<T>) => {
    ipcRenderer.removeListener(channel, callback as any);
  }
});

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}