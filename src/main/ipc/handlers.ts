// src/main/ipc/handlers.ts
import { IpcMain } from 'electron';
import { getDatabase } from '../database/init';
import { IpcChannels } from '../../shared/constants/ipc';
import type { Recording, Transcription, RecordingStatus } from '../../shared/types';

export function setupIpcHandlers(ipcMain: IpcMain) {
  // Recording handlers
  ipcMain.handle(IpcChannels.GET_AUDIO_FILES, async () => {
    const db = getDatabase();
    return db.getAllRecordings();
  });

  ipcMain.handle(IpcChannels.ADD_AUDIO_FILE, async (_, recording: Recording) => {
    const db = getDatabase();
    db.insertRecording(recording);
    return recording.id;
  });

  ipcMain.handle(IpcChannels.GET_RECORDING, async (_, id: string) => {
    const db = getDatabase();
    return db.getRecording(id);
  });

  ipcMain.handle(IpcChannels.UPDATE_RECORDING_STATUS, async (_, id: string, status: RecordingStatus, error?: string) => {
    const db = getDatabase();
    db.updateRecordingStatus(id, status, error);
    return { success: true };
  });

  // Transcription handlers
  ipcMain.handle(IpcChannels.GET_TRANSCRIPTION, async (_, recordingId: string) => {
    const db = getDatabase();
    return db.getTranscription(recordingId);
  });

  ipcMain.handle(IpcChannels.SAVE_TRANSCRIPTION, async (_, transcription: Transcription) => {
    const db = getDatabase();
    db.insertTranscription(transcription);
    return { success: true };
  });

  // Error handling wrapper
  function handleError(error: unknown) {
    console.error('IPC handler error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Wrap all handlers with error handling
  Object.values(IpcChannels).forEach(channel => {
    const originalHandler = ipcMain.listeners(channel)[0];
    if (originalHandler) {
      ipcMain.removeHandler(channel);
      ipcMain.handle(channel, async (...args) => {
        try {
          return await originalHandler(...args);
        } catch (error) {
          return handleError(error);
        }
      });
    }
  });
}