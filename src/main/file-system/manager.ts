import { watch, FSWatcher } from 'chokidar';
import path from 'path';
import { promises as fs } from 'fs';
import { AudioFile } from '../../shared/types';
import { FileSystemEvents } from './events';
import { DatabaseService } from '../database';
import { extractMetadata } from './metadata';
import { app } from 'electron';
import { debounce } from 'lodash';

export class FileSystemManager {
  private static instance: FileSystemManager;
  private watchers: Map<string, FSWatcher> = new Map();
  private events: FileSystemEvents;
  private db: DatabaseService;
  private validExtensions = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma']);
  private processingFiles: Set<string> = new Set();
  private retryQueue: Map<string, { attempts: number; timeout: NodeJS.Timeout }> = new Map();
  private MAX_RETRY_ATTEMPTS = 3;
  private RETRY_DELAY = 5000; // 5 seconds

  private constructor() {
    this.events = FileSystemEvents.getInstance();
    this.db = DatabaseService.getInstance();
    this.setupCleanup();
  }

  public static getInstance(): FileSystemManager {
    if (!FileSystemManager.instance) {
      FileSystemManager.instance = new FileSystemManager();
    }
    return FileSystemManager.instance;
  }

  private setupCleanup() {
    app.on('before-quit', async () => {
      await Promise.all(
        Array.from(this.watchers.values()).map(watcher => watcher.close())
      );
      this.watchers.clear();
    });
  }

  private debouncedProcessFile = debounce(async (filepath: string) => {
    if (this.processingFiles.has(filepath)) {
      return;
    }

    this.processingFiles.add(filepath);

    try {
      const metadata = await this.getRecordingMetadata(filepath);
      await this.db.addAudioFile(metadata);
      this.events.emit('fileAdded', metadata);
      this.processingFiles.delete(filepath);
      this.retryQueue.delete(filepath);
    } catch (error) {
      console.error(`Error processing file ${filepath}:`, error);
      
      const retryInfo = this.retryQueue.get(filepath) || { attempts: 0 };
      if (retryInfo.attempts < this.MAX_RETRY_ATTEMPTS) {
        const timeout = setTimeout(() => {
          this.processingFiles.delete(filepath);
          this.debouncedProcessFile(filepath);
        }, this.RETRY_DELAY);

        this.retryQueue.set(filepath, {
          attempts: retryInfo.attempts + 1,
          timeout
        });
      } else {
        this.events.emit('error', {
          type: 'fileProcessing',
          path: filepath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        this.processingFiles.delete(filepath);
        this.retryQueue.delete(filepath);
      }
    }
  }, 1000);

  public async watchDirectory(dirPath: string): Promise<void> {
    if (this.watchers.has(dirPath)) {
      return;
    }

    try {
      await fs.access(dirPath);
    } catch (error) {
      throw new Error(`Directory ${dirPath} does not exist or is not accessible`);
    }

    const watcher = watch(dirPath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      },
      ignored: /(^|[\/\\])\../ // Ignore hidden files
    });

    watcher
      .on('add', (filepath) => {
        if (this.isValidAudioFile(filepath)) {
          this.debouncedProcessFile(filepath);
        }
      })
      .on('change', (filepath) => {
        if (this.isValidAudioFile(filepath)) {
          this.debouncedProcessFile(filepath);
        }
      })
      .on('unlink', async (filepath) => {
        if (this.isValidAudioFile(filepath)) {
          await this.db.removeAudioFile(filepath);
          this.events.emit('fileRemoved', filepath);
        }
      })
      .on('error', (error) => {
        this.events.emit('error', {
          type: 'watcher',
          path: dirPath,
          error: error.message
        });
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

  private async scanDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const totalFiles = files.length;
      let processedFiles = 0;

      for (const file of files) {
        const filepath = path.join(dirPath, file.name);
        
        if (file.isFile() && this.isValidAudioFile(filepath)) {
          await this.debouncedProcessFile(filepath);
        }

        processedFiles++;
        this.events.emit('scanProgress', {
          directory: dirPath,
          total: totalFiles,
          processed: processedFiles
        });
      }
    } catch (error) {
      this.events.emit('error', {
        type: 'scan',
        path: dirPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private isValidAudioFile(filepath: string): boolean {
    const ext = path.extname(filepath).toLowerCase();
    return this.validExtensions.has(ext);
  }

  public async getWatchedDirectories(): Promise<string[]> {
    return Array.from(this.watchers.keys());
  }

  public getProcessingStatus(filepath: string): {
    isProcessing: boolean;
    retryCount?: number;
  } {
    return {
      isProcessing: this.processingFiles.has(filepath),
      retryCount: this.retryQueue.get(filepath)?.attempts
    };
  }

  public async cleanup(): Promise<void> {
    // Clear retry queues
    for (const { timeout } of this.retryQueue.values()) {
      clearTimeout(timeout);
    }
    this.retryQueue.clear();
    this.processingFiles.clear();

    // Close all watchers
    await Promise.all(
      Array.from(this.watchers.values()).map(watcher => watcher.close())
    );
    this.watchers.clear();
  }
}
