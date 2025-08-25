import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';
import fs from 'fs';

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// SQLite database file path
const dbPath = path.join(dataDir, 'steam-inventory.db');

// Create database connection
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Auto-create tables if they don't exist
try {
  // Check if accounts table exists, if not, create schema
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  if (tables.length === 0) {
    console.log('Creating database tables...');
    
    // Create tables manually since we don't have migrations setup
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "steamId" text NOT NULL,
        "nickname" text,
        "avatarUrl" text,
        "isPrivate" integer DEFAULT false NOT NULL,
        "lastUpdated" text DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS "cases" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "accountId" integer NOT NULL,
        "appId" text NOT NULL,
        "assetId" text NOT NULL,
        "classId" text,
        "instanceId" text,
        "name" text NOT NULL,
        "marketHashName" text NOT NULL,
        "iconUrl" text,
        "imageUrl" text,
        "quantity" integer DEFAULT 1 NOT NULL,
        "price" real,
        "lastUpdated" text DEFAULT (datetime('now')),
        FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "steamApiKey" text,
        "currency" text DEFAULT 'USD' NOT NULL,
        "requestDelay" integer DEFAULT 2000 NOT NULL,
        "userAgents" text NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "logs" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "level" text NOT NULL,
        "message" text NOT NULL,
        "details" text,
        "timestamp" text DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS "users" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" text NOT NULL,
        "hashedPassword" text NOT NULL
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS "accounts_steamId_unique" ON "accounts" ("steamId");
      CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique" ON "users" ("username");
    `);
    
    console.log('Database tables created successfully');
  }
} catch (error) {
  console.error('Database initialization error:', error);
}
