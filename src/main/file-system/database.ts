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
