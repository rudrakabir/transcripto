import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC functionality to renderer
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});