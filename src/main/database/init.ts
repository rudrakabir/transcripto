// src/main/database/init.ts
import { app } from 'electron';
import path from 'path';
import type Database from 'better-sqlite3';

let dbManager: any = null;

export const initializeDatabase = async () => {
  try {
    // Dynamic import to avoid Vite bundling issues
    const sqlite3 = await import('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
    
    // Import the DatabaseManager class dynamically
    const { DatabaseManager } = await import('../file-system/database');
    dbManager = DatabaseManager.getInstance(dbPath);
    return dbManager;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!dbManager) {
    throw new Error('Database not initialized');
  }
  return dbManager;
};

export const closeDatabase = () => {
  if (dbManager) {
    dbManager['db'].close();
    dbManager = null;
  }
};