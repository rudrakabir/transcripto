import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { AudioFile, Settings } from '../shared/schema';
import { migrate } from './database/migrations';

export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor() {
    try {
      const dbPath = path.join(app.getPath('userData'), 'transcripto.db');
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL'); // Better concurrent access
      this.db.pragma('synchronous = NORMAL'); // Better performance
      this.init();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('Database initialization failed');
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private init() {
    try {
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Create tables with proper indexing
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS audio_files (
          id TEXT PRIMARY KEY,
          path TEXT UNIQUE NOT NULL,
          fileName TEXT NOT NULL,
          size INTEGER NOT NULL,
          duration INTEGER,
          createdAt TEXT NOT NULL,
          modifiedAt TEXT NOT NULL,
          transcriptionStatus TEXT NOT NULL,
          transcriptionError TEXT,
          transcription TEXT,
          watchFolder TEXT NOT NULL,
          format TEXT,
          bitrate INTEGER,
          channels INTEGER,
          sampleRate INTEGER,
          lastAccessed TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_audio_files_path ON audio_files(path);
        CREATE INDEX IF NOT EXISTS idx_audio_files_status ON audio_files(transcriptionStatus);
        CREATE INDEX IF NOT EXISTS idx_audio_files_watchfolder ON audio_files(watchFolder);
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          watchFolders TEXT NOT NULL,
          whisperModel TEXT NOT NULL,
          autoTranscribe INTEGER NOT NULL,
          language TEXT,
          maxConcurrentTranscriptions INTEGER NOT NULL DEFAULT 2,
          transcriptionPriority TEXT DEFAULT 'modified',
          ffmpegPath TEXT,
          useGPU INTEGER DEFAULT 1
        );
      `);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS transcription_segments (
          id TEXT PRIMARY KEY,
          audioFileId TEXT NOT NULL,
          startTime REAL NOT NULL,
          endTime REAL NOT NULL,
          text TEXT NOT NULL,
          confidence REAL,
          speaker TEXT,
          FOREIGN KEY (audioFileId) REFERENCES audio_files(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_segments_audiofile ON transcription_segments(audioFileId);
      `);

      // Run migrations
      migrate(this.db);
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  // Transaction wrapper
  private transaction<T>(callback: () => T): T {
    try {
      const transaction = this.db.transaction(callback);
      return transaction();
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Audio files methods with improved error handling and performance
  addAudioFile(file: AudioFile): void {
    this.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO audio_files (
          id, path, fileName, size, duration, createdAt, modifiedAt,
          transcriptionStatus, transcriptionError, transcription, watchFolder,
          format, bitrate, channels, sampleRate, lastAccessed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        file.id,
        file.path,
        file.fileName,
        file.size,
        file.duration,
        file.createdAt.toISOString(),
        file.modifiedAt.toISOString(),
        file.transcriptionStatus,
        file.transcriptionError,
        file.transcription,
        file.watchFolder,
        file.format,
        file.bitrate,
        file.channels,
        file.sampleRate,
        new Date().toISOString()
      );
    });
  }

  getAudioFiles(options: {
    sortBy?: keyof AudioFile;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    status?: string[];
  } = {}): { total: number; files: AudioFile[] } {
    return this.transaction(() => {
      const {
        sortBy = 'modifiedAt',
        sortOrder = 'desc',
        limit,
        offset = 0,
        status
      } = options;

      const validColumns = [
        'id', 'path', 'fileName', 'size', 'duration', 'createdAt',
        'modifiedAt', 'transcriptionStatus', 'watchFolder', 'format',
        'bitrate', 'channels', 'sampleRate', 'lastAccessed'
      ];

      if (sortBy && !validColumns.includes(sortBy)) {
        throw new Error('Invalid sort column');
      }

      let query = 'SELECT * FROM audio_files';
      const params: any[] = [];

      if (status?.length) {
        query += ' WHERE transcriptionStatus IN (' + status.map(() => '?').join(',') + ')';
        params.push(...status);
      }

      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

      if (limit) {
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
      }

      const stmt = this.db.prepare(query);
      const countStmt = this.db.prepare(
        'SELECT COUNT(*) as count FROM audio_files' +
        (status?.length ? ' WHERE transcriptionStatus IN (' + status.map(() => '?').join(',') + ')' : '')
      );

      const files = stmt.all(...params).map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        modifiedAt: new Date(row.modifiedAt),
        lastAccessed: row.lastAccessed ? new Date(row.lastAccessed) : null
      }));

      const { count } = countStmt.get(...(status || []));

      return { total: count, files };
    });
  }
}

export const db = DatabaseService.getInstance();