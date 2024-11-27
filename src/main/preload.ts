// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/constants/ipc';

contextBridge.exposeInMainWorld('electron', {
  getSettings: () => ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
  saveSetting: (key: string, value: string) => 
    ipcRenderer.invoke(IpcChannels.SAVE_SETTING, key, value)
});

// Add types for TypeScript
declare global {
  interface Window {
    electron: {
      getSettings: () => Promise<any[]>;
      saveSetting: (key: string, value: string) => Promise<{ success: boolean }>;
    }
  }
}