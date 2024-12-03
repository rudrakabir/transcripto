import { ipcMain, dialog } from 'electron';
import { db } from './database';
import { fileWatcher } from './watcher';
import { transcriptionService } from './transcription';
import { Settings } from '../shared/schema';

export function setupIPC() {
  // Audio file operations
  ipcMain.handle('get-audio-files', () => {
    return db.getAudioFiles();
  });

  ipcMain.handle('get-audio-file', (_, id: string) => {
    return db.getAudioFile(id);
  });

  // Settings operations
  ipcMain.handle('get-settings', () => {
    return db.getSettings();
  });

  ipcMain.handle('update-settings', async (_, settings: Settings) => {
    db.saveSettings(settings);
    await fileWatcher.updateWatchFolders(settings.watchFolders);
    return settings;
  });

  // Folder selection dialog
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Manual transcription trigger
  ipcMain.handle('start-transcription', (_, fileId: string) => {
    const file = db.getAudioFile(fileId);
    if (file && file.transcriptionStatus === 'pending') {
      transcriptionService.addToQueue(file);
    }
  });
}