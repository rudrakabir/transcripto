import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase, getDatabase } from './database/init';
import { setupIpcHandlers } from './ipc/handlers';
import Store from 'electron-store';

const store = new Store();

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // Makes it look more native on macOS
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false // Required for better-sqlite3
    }
  });

  // Set up test setting in database
  try {
    const db = getDatabase();
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('testSetting', 'Hello from the database!');
    stmt.run('appVersion', app.getVersion());
  } catch (error) {
    console.error('Failed to set test settings:', error);
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }

  // Implement proper error handling
  mainWindow.webContents.on('crashed', () => {
    console.error('Window crashed! Attempting to reload...');
    mainWindow?.reload();
  });

  mainWindow.on('unresponsive', () => {
    console.error('Window unresponsive! Attempting to reload...');
    mainWindow?.reload();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(async () => {
  try {
    await initializeDatabase();
    setupIpcHandlers(ipcMain);
    createWindow();

    // Handle macOS re-activation
    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle macOS activation when no windows are open
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Graceful shutdown
app.on('before-quit', () => {
  try {
    const db = getDatabase();
    db.close();
  } catch (error) {
    console.error('Error closing database:', error);
  }
});