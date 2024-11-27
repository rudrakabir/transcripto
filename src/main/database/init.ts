// src/main/database/init.ts
import { app } from 'electron';
import path from 'path';

let db: any;

export const initializeDatabase = async () => {
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
    db = new Database(dbPath);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Add this export
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};