#!/bin/bash

# Create the directory structure
mkdir -p src/main/file-system

# Create the type definitions
cat > src/main/file-system/types.ts << 'EOL'
export interface AudioRecordingMetadata {
  id: string;
  filepath: string;
  filename: string;
  filesize: number;
  duration: number;
  created_at: number;
  modified_at: number;
  format: string;
  codec: string;
  bitrate: number;
  channels: number;
  sample_rate: number;
  transcription_status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
}

export interface FileSystemManager {
  // Directory Management
  watchDirectory(path: string): Promise<void>;
  unwatchDirectory(path: string): Promise<void>;
  getWatchedDirectories(): string[];
  
  // File Operations
  scanDirectory(path: string): Promise<AudioRecordingMetadata[]>;
  getRecordingMetadata(filepath: string): Promise<AudioRecordingMetadata>;
  isValidRecording(filepath: string): boolean;
  
  // Event Handling
  onRecordingAdded(callback: (file: AudioRecordingMetadata) => void): void;
  onRecordingChanged(callback: (file: AudioRecordingMetadata) => void): void;
  onRecordingRemoved(callback: (filepath: string) => void): void;
}
EOL

# Create individual files with basic exports
cat > src/main/file-system/index.ts << 'EOL'
export * from './types';
export { FileSystemManagerImpl as FileSystemManager } from './manager';
export { FileSystemEvents, EVENT_TYPES } from './events';
EOL

cat > src/main/file-system/events.ts << 'EOL'
import { EventEmitter } from 'events';

export const EVENT_TYPES = {
  RECORDING_ADDED: 'recording-added',
  RECORDING_CHANGED: 'recording-changed',
  RECORDING_REMOVED: 'recording-removed',
  SCAN_PROGRESS: 'scan-progress',
  ERROR: 'error'
} as const;

export class FileSystemEvents extends EventEmitter {
  private static instance: FileSystemEvents;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): FileSystemEvents {
    if (!FileSystemEvents.instance) {
      FileSystemEvents.instance = new FileSystemEvents();
    }
    return FileSystemEvents.instance;
  }
}
EOL

cat > src/main/file-system/metadata.ts << 'EOL'
import ffmpeg from 'fluent-ffmpeg';
import { AudioRecordingMetadata } from './types';
import { v4 as uuidv4 } from 'uuid';

export async function extractMetadata(filepath: string): Promise<AudioRecordingMetadata> {
  const probeData = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filepath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const stream = probeData.streams[0];
  const format = probeData.format;

  return {
    id: uuidv4(),
    filepath,
    filename: filepath.split('/').pop() || '',
    filesize: format.size,
    duration: format.duration,
    created_at: Math.floor(new Date().getTime() / 1000),
    modified_at: Math.floor(new Date().getTime() / 1000),
    format: format.format_name,
    codec: stream.codec_name,
    bitrate: format.bit_rate,
    channels: stream.channels,
    sample_rate: stream.sample_rate,
    transcription_status: 'pending',
  };
}
EOL

cat > src/main/file-system/database.ts << 'EOL'
import Database from 'better-sqlite3';
import { AudioRecordingMetadata } from './types';

export class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;

  private constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.init();
  }

  public static getInstance(dbPath: string): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(dbPath);
    }
    return DatabaseManager.instance;
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recordings (
        id TEXT PRIMARY KEY,
        filepath TEXT UNIQUE,
        filename TEXT,
        filesize INTEGER,
        duration REAL,
        created_at INTEGER,
        modified_at INTEGER,
        format TEXT,
        codec TEXT,
        bitrate INTEGER,
        channels INTEGER,
        sample_rate INTEGER,
        transcription_status TEXT,
        error_message TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_filepath ON recordings(filepath);
      CREATE INDEX IF NOT EXISTS idx_status ON recordings(transcription_status);
    `);
  }

  public insertRecording(metadata: AudioRecordingMetadata): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO recordings (
        id, filepath, filename, filesize, duration, created_at, modified_at,
        format, codec, bitrate, channels, sample_rate, transcription_status,
        error_message
      ) VALUES (
        @id, @filepath, @filename, @filesize, @duration, @created_at, @modified_at,
        @format, @codec, @bitrate, @channels, @sample_rate, @transcription_status,
        @error_message
      )
    `);

    this.db.transaction(() => {
      stmt.run(metadata);
    })();
  }

  public getRecording(filepath: string): AudioRecordingMetadata | undefined {
    const stmt = this.db.prepare('SELECT * FROM recordings WHERE filepath = ?');
    return stmt.get(filepath) as AudioRecordingMetadata | undefined;
  }

  public getAllRecordings(): AudioRecordingMetadata[] {
    const stmt = this.db.prepare('SELECT * FROM recordings');
    return stmt.all() as AudioRecordingMetadata[];
  }

  public removeRecording(filepath: string): void {
    const stmt = this.db.prepare('DELETE FROM recordings WHERE filepath = ?');
    stmt.run(filepath);
  }
}
EOL

cat > src/main/file-system/utils.ts << 'EOL'
import path from 'path';

export const isValidAudioExtension = (filepath: string): boolean => {
  const validExtensions = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac']);
  return validExtensions.has(path.extname(filepath).toLowerCase());
};
EOL

cat > src/main/file-system/manager.ts << 'EOL'
import { watch, FSWatcher } from 'chokidar';
import path from 'path';
import { promises as fs } from 'fs';
import { AudioRecordingMetadata, FileSystemManager } from './types';
import { FileSystemEvents, EVENT_TYPES } from './events';
import { DatabaseManager } from './database';
import { extractMetadata } from './metadata';

export class FileSystemManagerImpl implements FileSystemManager {
  private watchers: Map<string, FSWatcher> = new Map();
  private events: FileSystemEvents;
  private db: DatabaseManager;
  private validExtensions = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac']);

  constructor(dbPath: string) {
    this.events = FileSystemEvents.getInstance();
    this.db = DatabaseManager.getInstance(dbPath);
  }

  public async watchDirectory(dirPath: string): Promise<void> {
    if (this.watchers.has(dirPath)) {
      return;
    }

    const watcher = watch(dirPath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    watcher
      .on('add', async (filepath) => {
        if (this.isValidRecording(filepath)) {
          try {
            const metadata = await this.getRecordingMetadata(filepath);
            this.db.insertRecording(metadata);
            this.events.emit(EVENT_TYPES.RECORDING_ADDED, metadata);
          } catch (error) {
            this.events.emit(EVENT_TYPES.ERROR, { filepath, error });
          }
        }
      })
      .on('change', async (filepath) => {
        if (this.isValidRecording(filepath)) {
          try {
            const metadata = await this.getRecordingMetadata(filepath);
            this.db.insertRecording(metadata);
            this.events.emit(EVENT_TYPES.RECORDING_CHANGED, metadata);
          } catch (error) {
            this.events.emit(EVENT_TYPES.ERROR, { filepath, error });
          }
        }
      })
      .on('unlink', (filepath) => {
        if (this.isValidRecording(filepath)) {
          this.db.removeRecording(filepath);
          this.events.emit(EVENT_TYPES.RECORDING_REMOVED, filepath);
        }
      });

    this.watchers.set(dirPath, watcher);
    await this.scanDirectory(dirPath);
  }

  public async unwatchDirectory(dirPath: string): Promise<void> {
    const watcher = this.watchers.get(dirPath);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(dirPath);
    }
  }

  public getWatchedDirectories(): string[] {
    return Array.from(this.watchers.keys());
  }

  public async scanDirectory(dirPath: string): Promise<AudioRecordingMetadata[]> {
    const recordings: AudioRecordingMetadata[] = [];
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    let processed = 0;

    for (const file of files) {
      const filepath = path.join(dirPath, file.name);
      
      if (file.isFile() && this.isValidRecording(filepath)) {
        try {
          const metadata = await this.getRecordingMetadata(filepath);
          recordings.push(metadata);
          this.db.insertRecording(metadata);
        } catch (error) {
          this.events.emit(EVENT_TYPES.ERROR, { filepath, error });
        }
      }

      processed++;
      this.events.emit(EVENT_TYPES.SCAN_PROGRESS, {
        total: files.length,
        processed,
        directory: dirPath
      });
    }

    return recordings;
  }

  public async getRecordingMetadata(filepath: string): Promise<AudioRecordingMetadata> {
    const existing = this.db.getRecording(filepath);
    if (existing) {
      return existing;
    }
    return await extractMetadata(filepath);
  }

  public isValidRecording(filepath: string): boolean {
    const ext = path.extname(filepath).toLowerCase();
    return this.validExtensions.has(ext);
  }

  public onRecordingAdded(callback: (file: AudioRecordingMetadata) => void): void {
    this.events.on(EVENT_TYPES.RECORDING_ADDED, callback);
  }

  public onRecordingChanged(callback: (file: AudioRecordingMetadata) => void): void {
    this.events.on(EVENT_TYPES.RECORDING_CHANGED, callback);
  }

  public onRecordingRemoved(callback: (filepath: string) => void): void {
    this.events.on(EVENT_TYPES.RECORDING_REMOVED, callback);
  }
}
EOL
