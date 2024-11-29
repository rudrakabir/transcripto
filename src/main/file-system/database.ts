import Database from 'better-sqlite3';
import { 
  Recording, 
  Transcription, 
  RecordingStatus,
  utils
} from '../../shared/types';

type SqliteRow = Record<string, any>;

export class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;

  private constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
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
        filepath TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        filesize INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        modified_at INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'error')),
        error_message TEXT,
        metadata JSON NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transcriptions (
        id TEXT PRIMARY KEY,
        recording_id TEXT NOT NULL,
        content TEXT NOT NULL,
        language TEXT NOT NULL,
        confidence REAL NOT NULL,
        segments JSON NOT NULL,
        created_at INTEGER NOT NULL,
        modified_at INTEGER NOT NULL,
        FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_recordings_filepath ON recordings(filepath);
      CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
      CREATE INDEX IF NOT EXISTS idx_transcriptions_recording_id ON transcriptions(recording_id);
    `);
  }

  public insertRecording(recording: Recording): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO recordings (
        id, filepath, filename, filesize, duration, created_at, modified_at,
        status, error_message, metadata
      ) VALUES (
        @id, @filepath, @filename, @filesize, @duration, @created_at, @modified_at,
        @status, @error_message, @metadata
      )
    `);

    try {
      utils.validateRecording(recording);
      
      this.db.transaction(() => {
        stmt.run({
          ...recording,
          metadata: JSON.stringify(recording.metadata)
        });
      })();
    } catch (error) {
      console.error('Failed to insert recording:', error);
      throw error;
    }
  }

  private mapRowToRecording(row: SqliteRow): Recording {
    return {
      id: row.id,
      filepath: row.filepath,
      filename: row.filename,
      filesize: row.filesize,
      duration: row.duration,
      created_at: row.created_at,
      modified_at: row.modified_at,
      status: row.status as RecordingStatus,
      error_message: row.error_message,
      metadata: JSON.parse(row.metadata)
    };
  }

  private mapRowToTranscription(row: SqliteRow): Transcription {
    return {
      id: row.id,
      recording_id: row.recording_id,
      content: row.content,
      language: row.language,
      confidence: row.confidence,
      segments: JSON.parse(row.segments),
      created_at: row.created_at,
      modified_at: row.modified_at
    };
  }

  public getRecording(id: string): Recording | null {
    const stmt = this.db.prepare('SELECT * FROM recordings WHERE id = ?');
    try {
      const row = stmt.get(id) as SqliteRow;
      return row ? this.mapRowToRecording(row) : null;
    } catch (error) {
      console.error('Failed to get recording:', error);
      throw error;
    }
  }

  public getRecordingByPath(filepath: string): Recording | null {
    const stmt = this.db.prepare('SELECT * FROM recordings WHERE filepath = ?');
    try {
      const row = stmt.get(filepath) as SqliteRow;
      return row ? this.mapRowToRecording(row) : null;
    } catch (error) {
      console.error('Failed to get recording by path:', error);
      throw error;
    }
  }

  public getAllRecordings(): Recording[] {
    const stmt = this.db.prepare('SELECT * FROM recordings ORDER BY created_at DESC');
    try {
      const rows = stmt.all() as SqliteRow[];
      return rows.map(row => this.mapRowToRecording(row));
    } catch (error) {
      console.error('Failed to get all recordings:', error);
      throw error;
    }
  }

  public updateRecordingStatus(id: string, status: RecordingStatus, errorMessage?: string): void {
    const stmt = this.db.prepare(`
      UPDATE recordings 
      SET status = ?, error_message = ?, modified_at = ?
      WHERE id = ?
    `);
    
    try {
      this.db.transaction(() => {
        stmt.run(status, errorMessage, Date.now(), id);
      })();
    } catch (error) {
      console.error('Failed to update recording status:', error);
      throw error;
    }
  }

  public insertTranscription(transcription: Transcription): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO transcriptions (
        id, recording_id, content, language, confidence,
        segments, created_at, modified_at
      ) VALUES (
        @id, @recording_id, @content, @language, @confidence,
        @segments, @created_at, @modified_at
      )
    `);

    try {
      utils.validateTranscription(transcription);
      
      this.db.transaction(() => {
        stmt.run({
          ...transcription,
          segments: JSON.stringify(transcription.segments)
        });
      })();
    } catch (error) {
      console.error('Failed to insert transcription:', error);
      throw error;
    }
  }

  public getTranscription(recordingId: string): Transcription | null {
    const stmt = this.db.prepare('SELECT * FROM transcriptions WHERE recording_id = ?');
    try {
      const row = stmt.get(recordingId) as SqliteRow;
      return row ? this.mapRowToTranscription(row) : null;
    } catch (error) {
      console.error('Failed to get transcription:', error);
      throw error;
    }
  }

  public deleteRecording(id: string): void {
    const stmt = this.db.prepare('DELETE FROM recordings WHERE id = ?');
    try {
      this.db.transaction(() => {
        stmt.run(id);
      })();
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }
}