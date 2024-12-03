import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase, getDatabase } from './database/init';
import { setupIpcHandlers } from './ipc/handlers';
import Store from 'electron-store';
import events from 'events';
import { Recording, RecordingStatus } from '../shared/types';
import { webcrypto } from 'crypto';
import { FileSystemManager } from './file-system';
import { promises as fs } from 'fs';

const store = new Store();
const crypto = (globalThis as any).crypto || webcrypto;

let mainWindow: BrowserWindow | null = null;

const testDatabase = async () => {
  try {
    const dbManager = getDatabase();
    
    // Test recording
    const testRecording: Recording = {
      id: crypto.randomUUID(),
      filepath: '/test/path/audio.mp3',
      filename: 'audio.mp3',
      filesize: 1024 * 1024, // 1MB
      duration: 120, // 2 minutes
      created_at: Date.now(),
      modified_at: Date.now(),
      status: RecordingStatus.PENDING,
      error_message: '',
      metadata: {
        format: 'mp3',
        bitrate: 128000,
        channels: 2,
        sample_rate: 44100,
        codec: 'mp3',
      }
    };

    // Insert recording
    console.log('Inserting test recording...');
    dbManager.insertRecording(testRecording);

    // Retrieve it
    console.log('Retrieving test recording...');
    const retrieved = dbManager.getRecording(testRecording.id);
    console.log('Retrieved recording:', retrieved);

    // Get all recordings
    console.log('Getting all recordings...');
    const allRecordings = dbManager.getAllRecordings();
    console.log(`Found ${allRecordings.length} recordings`);

    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
};

const testFileSystemBasic = async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
    const testDir = path.join(app.getPath('downloads'), 'TranscriptoTest');
    
    // Ensure test directory exists
    await fs.promises.mkdir(testDir, { recursive: true });
    
    const fsManager = new FileSystemManager(dbPath);
    console.log('FileSystem Manager created');
    
    fsManager.onRecordingAdded((file) => console.log('Recording added:', file));
    await fsManager.watchDirectory(testDir);
    console.log('Watching directory:', testDir);
    
    return true;
  } catch (error) {
    console.error('FileSystem basic test failed:', error);
    return false;
  }
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  try {
    const dbManager = getDatabase();
    const db = dbManager['db'];
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
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
    await createWindow();

    console.log('Running database test...');
    const dbTestResult = await testDatabase();
    console.log('Database test completed:', dbTestResult ? 'SUCCESS' : 'FAILED');

    console.log('Running basic filesystem test...');
    const fsTestResult = await testFileSystemBasic();
    console.log('FileSystem test completed:', fsTestResult ? 'SUCCESS' : 'FAILED');

    app.on('activate', async () => {
      if (mainWindow === null) {
        await createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  try {
    const dbManager = getDatabase();
    if (dbManager && dbManager['db']) {
      dbManager['db'].close();
    }
  } catch (error) {
    console.error('Error closing database:', error);
    process.exit(1);
  }
});

