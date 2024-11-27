import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/constants/ipc';

contextBridge.exposeInMainWorld('electron', {
  getSettings: () => ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
  saveSetting: (key: string, value: string) => 
    ipcRenderer.invoke(IpcChannels.SAVE_SETTING, key, value)
});
