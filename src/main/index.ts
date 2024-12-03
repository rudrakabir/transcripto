import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIPC } from './ipc';
import { fileWatcher } from './watcher';
import { db } from './database';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }
}

app.whenReady().then(async () => {
  // Initialize services
  setupIPC();
  
  // Initialize watch folders from settings
  const settings = db.getSettings();
  await Promise.all(settings.watchFolders.map(folder => fileWatcher.watchFolder(folder)));

  // Create window
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});