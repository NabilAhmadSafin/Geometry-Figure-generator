import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  // On Vercel, process.cwd() is read-only. We must use /tmp for SQLite, 
  // though please note this data will be wiped when the serverless function spins down.
  const isVercel = process.env.VERCEL === '1';
  const dbPath = isVercel 
    ? path.join('/tmp', 'database.sqlite')
    : path.join(process.cwd(), 'database.sqlite');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      problem_text TEXT NOT NULL,
      generated_commands TEXT NOT NULL,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  return db;
}
