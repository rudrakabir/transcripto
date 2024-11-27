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
