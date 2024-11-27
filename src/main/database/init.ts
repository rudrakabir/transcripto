import { app } from 'electron';
import path from 'path';

let db: any;

export const initializeDatabase = async () => {
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
    db = new Database(dbPath);
    
    // Create settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Create recordings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS recordings (
        id TEXT PRIMARY KEY,
        filepath TEXT NOT NULL,
        filename TEXT NOT NULL,
        filesize INTEGER,
        duration INTEGER,
        created_at INTEGER,
        modified_at INTEGER,
        transcription_status TEXT,
        error_message TEXT,
        metadata JSON
      );
    `);

    // Create transcriptions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS transcriptions (
        id TEXT PRIMARY KEY,
        recording_id TEXT NOT NULL,
        content TEXT,
        segments JSON,
        language TEXT DEFAULT 'en',
        created_at INTEGER,
        modified_at INTEGER,
        FOREIGN KEY (recording_id) REFERENCES recordings(id)
      );
    `);
    
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};