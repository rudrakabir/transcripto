import { IpcMain } from 'electron';
import { getDatabase } from '../database/init';
import { IpcChannels } from '../../shared/constants/ipc';
import { TranscriptionQueueManager } from '../transcription/queue-manager';

export const setupIpcHandlers = (ipcMain: IpcMain) => {
  const transcriptionQueue = TranscriptionQueueManager.getInstance();

  // Existing settings handlers
  ipcMain.handle(IpcChannels.GET_SETTINGS, async () => {
    const db = getDatabase();
    const settings = db.prepare('SELECT * FROM settings').all();
    return settings;
  });

  ipcMain.handle(IpcChannels.SAVE_SETTING, async (_, key: string, value: string) => {
    const db = getDatabase();
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
    return { success: true };
  });

  // New transcription handlers
  ipcMain.handle(IpcChannels.START_TRANSCRIPTION, async (_, request) => {
    await transcriptionQueue.addToQueue(request);
    return { success: true };
  });

  ipcMain.handle(IpcChannels.CANCEL_TRANSCRIPTION, (_, recordingId: string) => {
    transcriptionQueue.cancelTranscription(recordingId);
    return { success: true };
  });

  ipcMain.handle(IpcChannels.GET_TRANSCRIPTION_STATUS, (_, recordingId: string) => {
    return transcriptionQueue.getStatus(recordingId);
  });

  ipcMain.handle(IpcChannels.GET_TRANSCRIPTION, (_, recordingId: string) => {
    const db = getDatabase();
    const transcription = db.prepare('SELECT * FROM transcriptions WHERE recording_id = ?')
      .get(recordingId);
    return transcription;
  });

  ipcMain.handle(IpcChannels.GET_TRANSCRIPTION_PROGRESS, (_, recordingId: string) => {
    const db = getDatabase();
    const status = db.prepare('SELECT transcription_status, error_message FROM recordings WHERE id = ?')
      .get(recordingId);
    return status;
  });
};