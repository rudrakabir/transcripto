import { IpcMain } from 'electron';
import { getDatabase } from '../database/init';
import { IpcChannels } from '../../shared/constants/ipc';

export const setupIpcHandlers = (ipcMain: IpcMain) => {
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
};