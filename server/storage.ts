import { accounts, type Account, type InsertAccount, cases, type Case, type InsertCase, settings, type Settings, type InsertSettings, logs, type Log, type InsertLog, users, type User, type InsertUser } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  getAccountBySteamId(steamId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Case operations
  getCases(accountId?: number): Promise<Case[]>;
  getCase(id: number): Promise<Case | undefined>;
  createCase(caseItem: InsertCase): Promise<Case>;
  updateCase(id: number, caseItem: Partial<Case>): Promise<Case | undefined>;
  upsertCase(caseItem: InsertCase): Promise<Case>;
  deleteCase(id: number): Promise<boolean>;
  deleteCasesByAccountId(accountId: number): Promise<boolean>;
  
  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  saveSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings | undefined>;
  
  // Log operations
  getLogs(limit: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  clearLogs(): Promise<boolean>;
  
  // User operations (from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// In-memory storage for development/testing
export class MemStorage implements IStorage {
  private accounts: Map<number, Account>;
  private cases: Map<number, Case>;
  private settings: Settings | undefined;
  private logs: Map<number, Log>;
  private users: Map<number, User>;
  private accountsCurrentId: number = 1;
  private casesCurrentId: number = 1;
  private logsCurrentId: number = 1;
  private usersCurrentId: number = 1;

  constructor() {
    this.accounts = new Map();
    this.cases = new Map();
    this.logs = new Map();
    this.users = new Map();
    
    // Initialize default settings
    this.settings = {
      id: 1,
      steamApiKey: process.env.STEAM_API_KEY || '',
      currency: 'USD',
      requestDelay: 2000,
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      ],
      lastBackup: new Date()
    };
  }

  // Account operations
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountBySteamId(steamId: string): Promise<Account | undefined> {
    return Array.from(this.accounts.values()).find(account => account.steamId === steamId);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.accountsCurrentId++;
    const newAccount: Account = { ...account, id, lastUpdated: new Date() };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const existingAccount = this.accounts.get(id);
    if (!existingAccount) return undefined;
    
    const updatedAccount: Account = { ...existingAccount, ...accountUpdate, lastUpdated: new Date() };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    // Remove all cases associated with this account
    await this.deleteCasesByAccountId(id);
    return this.accounts.delete(id);
  }

  // Case operations
  async getCases(accountId?: number): Promise<Case[]> {
    const allCases = Array.from(this.cases.values());
    if (accountId) {
      return allCases.filter(c => c.accountId === accountId);
    }
    return allCases;
  }

  async getCase(id: number): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async createCase(caseItem: InsertCase): Promise<Case> {
    const id = this.casesCurrentId++;
    const newCase: Case = { ...caseItem, id, lastUpdated: new Date() };
    this.cases.set(id, newCase);
    return newCase;
  }

  async updateCase(id: number, caseUpdate: Partial<Case>): Promise<Case | undefined> {
    const existingCase = this.cases.get(id);
    if (!existingCase) return undefined;
    
    const updatedCase: Case = { ...existingCase, ...caseUpdate, lastUpdated: new Date() };
    this.cases.set(id, updatedCase);
    return updatedCase;
  }

  async upsertCase(caseItem: InsertCase): Promise<Case> {
    // Find existing case by accountId, appId, assetId
    const existingCase = Array.from(this.cases.values()).find(
      c => c.accountId === caseItem.accountId && 
           c.appId === caseItem.appId && 
           c.assetId === caseItem.assetId
    );
    
    if (existingCase) {
      const updated = await this.updateCase(existingCase.id, caseItem);
      return updated!;
    } else {
      return await this.createCase(caseItem);
    }
  }

  async deleteCase(id: number): Promise<boolean> {
    return this.cases.delete(id);
  }

  async deleteCasesByAccountId(accountId: number): Promise<boolean> {
    const casesToDelete = Array.from(this.cases.values())
      .filter(c => c.accountId === accountId)
      .map(c => c.id);
    
    for (const id of casesToDelete) {
      this.cases.delete(id);
    }
    
    return true;
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async saveSettings(newSettings: InsertSettings): Promise<Settings> {
    this.settings = { ...newSettings, id: 1, lastBackup: new Date() };
    return this.settings;
  }

  async updateSettings(settingsUpdate: Partial<Settings>): Promise<Settings | undefined> {
    if (!this.settings) return undefined;
    
    this.settings = { ...this.settings, ...settingsUpdate };
    return this.settings;
  }

  // Log operations
  async getLogs(limit: number): Promise<Log[]> {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const id = this.logsCurrentId++;
    const newLog: Log = { ...log, id, timestamp: new Date() };
    this.logs.set(id, newLog);
    return newLog;
  }

  async clearLogs(): Promise<boolean> {
    this.logs.clear();
    return true;
  }

  // User operations (from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.usersCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

// SQLite storage implementation
export class SQLiteStorage implements IStorage {
  private db?: Database;
  private dbPath: string;
  
  constructor(dbPath?: string) {
    // If no path provided, use a sensible default
    this.dbPath = dbPath || path.join(process.cwd(), 'steam_inventory.db');
  }
  
  async initialize(): Promise<void> {
    // Ensure the directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Open database connection
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });
    
    // Create tables if they don't exist
    await this.createTables();
    
    // Create default settings if not exists
    const settings = await this.getSettings();
    if (!settings) {
      await this.saveSettings({
        steamApiKey: process.env.STEAM_API_KEY || '',
        currency: 'USD',
        requestDelay: 2000,
        userAgents: [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        ]
      });
    }
  }
  
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Accounts table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        steam_id TEXT NOT NULL UNIQUE,
        nickname TEXT,
        profile_url TEXT,
        avatar_url TEXT,
        is_private INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Cases table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        app_id TEXT NOT NULL,
        asset_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        instance_id TEXT NOT NULL,
        market_hash_name TEXT NOT NULL,
        image_url TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `);
    
    // Settings table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        steam_api_key TEXT,
        currency TEXT DEFAULT 'USD',
        request_delay INTEGER DEFAULT 2000,
        user_agents TEXT DEFAULT '[]',
        last_backup DATETIME
      )
    `);
    
    // Logs table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT
      )
    `);
    
    // Users table (from original)
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);
  }
  
  // Account operations
  async getAccounts(): Promise<Account[]> {
    if (!this.db) throw new Error('Database not initialized');
    const accounts = await this.db.all(`SELECT * FROM accounts ORDER BY nickname, steam_id`);
    return accounts.map(account => ({
      ...account,
      isPrivate: Boolean(account.is_private),
      lastUpdated: new Date(account.last_updated)
    })) as Account[];
  }

  async getAccount(id: number): Promise<Account | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    const account = await this.db.get(`SELECT * FROM accounts WHERE id = ?`, id);
    if (!account) return undefined;
    
    return {
      ...account,
      isPrivate: Boolean(account.is_private),
      lastUpdated: new Date(account.last_updated)
    } as Account;
  }

  async getAccountBySteamId(steamId: string): Promise<Account | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    const account = await this.db.get(`SELECT * FROM accounts WHERE steam_id = ?`, steamId);
    if (!account) return undefined;
    
    return {
      ...account,
      isPrivate: Boolean(account.is_private),
      lastUpdated: new Date(account.last_updated)
    } as Account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.run(`
      INSERT INTO accounts (steam_id, nickname, profile_url, avatar_url, is_private)
      VALUES (?, ?, ?, ?, ?)
    `, 
    account.steamId, 
    account.nickname, 
    account.profileUrl, 
    account.avatarUrl, 
    account.isPrivate ? 1 : 0
    );
    
    return {
      ...account,
      id: result.lastID!,
      lastUpdated: new Date()
    } as Account;
  }

  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    const existingAccount = await this.getAccount(id);
    if (!existingAccount) return undefined;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (accountUpdate.steamId !== undefined) {
      updates.push('steam_id = ?');
      values.push(accountUpdate.steamId);
    }
    
    if (accountUpdate.nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(accountUpdate.nickname);
    }
    
    if (accountUpdate.profileUrl !== undefined) {
      updates.push('profile_url = ?');
      values.push(accountUpdate.profileUrl);
    }
    
    if (accountUpdate.avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      values.push(accountUpdate.avatarUrl);
    }
    
    if (accountUpdate.isPrivate !== undefined) {
      updates.push('is_private = ?');
      values.push(accountUpdate.isPrivate ? 1 : 0);
    }
    
    updates.push('last_updated = CURRENT_TIMESTAMP');
    
    if (updates.length === 0) return existingAccount;
    
    values.push(id);
    
    await this.db.run(
      `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );
    
    return await this.getAccount(id);
  }

  async deleteAccount(id: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Delete all cases associated with this account
    await this.deleteCasesByAccountId(id);
    
    const result = await this.db.run(`DELETE FROM accounts WHERE id = ?`, id);
    return result.changes! > 0;
  }

  // Case operations
  async getCases(accountId?: number): Promise<Case[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let sql = `SELECT * FROM cases`;
    const params: any[] = [];
    
    if (accountId !== undefined) {
      sql += ` WHERE account_id = ?`;
      params.push(accountId);
    }
    
    sql += ` ORDER BY name`;
    
    const cases = await this.db.all(sql, ...params);
    return cases.map(c => ({
      ...c,
      lastUpdated: new Date(c.last_updated)
    })) as Case[];
  }

  async getCase(id: number): Promise<Case | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    const caseItem = await this.db.get(`SELECT * FROM cases WHERE id = ?`, id);
    if (!caseItem) return undefined;
    
    return {
      ...caseItem,
      lastUpdated: new Date(caseItem.last_updated)
    } as Case;
  }

  async createCase(caseItem: InsertCase): Promise<Case> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.run(`
      INSERT INTO cases (
        account_id, name, app_id, asset_id, class_id, instance_id, 
        market_hash_name, image_url, quantity, price
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
    caseItem.accountId,
    caseItem.name,
    caseItem.appId,
    caseItem.assetId,
    caseItem.classId,
    caseItem.instanceId,
    caseItem.marketHashName,
    caseItem.imageUrl,
    caseItem.quantity,
    caseItem.price
    );
    
    return {
      ...caseItem,
      id: result.lastID!,
      lastUpdated: new Date()
    } as Case;
  }

  async updateCase(id: number, caseUpdate: Partial<Case>): Promise<Case | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    const existingCase = await this.getCase(id);
    if (!existingCase) return undefined;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (caseUpdate.accountId !== undefined) {
      updates.push('account_id = ?');
      values.push(caseUpdate.accountId);
    }
    
    if (caseUpdate.name !== undefined) {
      updates.push('name = ?');
      values.push(caseUpdate.name);
    }
    
    if (caseUpdate.appId !== undefined) {
      updates.push('app_id = ?');
      values.push(caseUpdate.appId);
    }
    
    if (caseUpdate.assetId !== undefined) {
      updates.push('asset_id = ?');
      values.push(caseUpdate.assetId);
    }
    
    if (caseUpdate.classId !== undefined) {
      updates.push('class_id = ?');
      values.push(caseUpdate.classId);
    }
    
    if (caseUpdate.instanceId !== undefined) {
      updates.push('instance_id = ?');
      values.push(caseUpdate.instanceId);
    }
    
    if (caseUpdate.marketHashName !== undefined) {
      updates.push('market_hash_name = ?');
      values.push(caseUpdate.marketHashName);
    }
    
    if (caseUpdate.imageUrl !== undefined) {
      updates.push('image_url = ?');
      values.push(caseUpdate.imageUrl);
    }
    
    if (caseUpdate.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(caseUpdate.quantity);
    }
    
    if (caseUpdate.price !== undefined) {
      updates.push('price = ?');
      values.push(caseUpdate.price);
    }
    
    updates.push('last_updated = CURRENT_TIMESTAMP');
    
    if (updates.length === 0) return existingCase;
    
    values.push(id);
    
    await this.db.run(
      `UPDATE cases SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );
    
    return await this.getCase(id);
  }

  async upsertCase(caseItem: InsertCase): Promise<Case> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Find existing case by accountId, appId, assetId
    const existingCase = await this.db.get(`
      SELECT * FROM cases 
      WHERE account_id = ? AND app_id = ? AND asset_id = ?
    `, caseItem.accountId, caseItem.appId, caseItem.assetId);
    
    if (existingCase) {
      const updated = await this.updateCase(existingCase.id, caseItem);
      return updated!;
    } else {
      return await this.createCase(caseItem);
    }
  }

  async deleteCase(id: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.run(`DELETE FROM cases WHERE id = ?`, id);
    return result.changes! > 0;
  }

  async deleteCasesByAccountId(accountId: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.run(`DELETE FROM cases WHERE account_id = ?`, accountId);
    return true; // Return true even if no cases were deleted
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    const settings = await this.db.get(`SELECT * FROM settings LIMIT 1`);
    if (!settings) return undefined;
    
    return {
      ...settings,
      userAgents: JSON.parse(settings.user_agents),
      lastBackup: settings.last_backup ? new Date(settings.last_backup) : undefined
    } as Settings;
  }

  async saveSettings(settings: InsertSettings): Promise<Settings> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Check if settings already exist
    const existingSettings = await this.getSettings();
    
    if (existingSettings) {
      // Update existing settings
      return await this.updateSettings(settings) as Settings;
    } else {
      // Create new settings
      const result = await this.db.run(`
        INSERT INTO settings (steam_api_key, currency, request_delay, user_agents)
        VALUES (?, ?, ?, ?)
      `, 
      settings.steamApiKey, 
      settings.currency, 
      settings.requestDelay, 
      JSON.stringify(settings.userAgents)
      );
      
      return {
        ...settings,
        id: result.lastID!,
        lastBackup: undefined
      } as Settings;
    }
  }

  async updateSettings(settingsUpdate: Partial<Settings>): Promise<Settings | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (settingsUpdate.steamApiKey !== undefined) {
      updates.push('steam_api_key = ?');
      values.push(settingsUpdate.steamApiKey);
    }
    
    if (settingsUpdate.currency !== undefined) {
      updates.push('currency = ?');
      values.push(settingsUpdate.currency);
    }
    
    if (settingsUpdate.requestDelay !== undefined) {
      updates.push('request_delay = ?');
      values.push(settingsUpdate.requestDelay);
    }
    
    if (settingsUpdate.userAgents !== undefined) {
      updates.push('user_agents = ?');
      values.push(JSON.stringify(settingsUpdate.userAgents));
    }
    
    if (settingsUpdate.lastBackup !== undefined) {
      updates.push('last_backup = ?');
      values.push(settingsUpdate.lastBackup.toISOString());
    }
    
    if (updates.length === 0) {
      const currentSettings = await this.getSettings();
      return currentSettings;
    }
    
    await this.db.run(
      `UPDATE settings SET ${updates.join(', ')} WHERE id = 1 OR id IS NULL`,
      ...values
    );
    
    return await this.getSettings();
  }

  // Log operations
  async getLogs(limit: number): Promise<Log[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const logs = await this.db.all(`
      SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?
    `, limit);
    
    return logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp),
      details: log.details ? JSON.parse(log.details) : null
    })) as Log[];
  }

  async createLog(log: InsertLog): Promise<Log> {
    if (!this.db) throw new Error('Database not initialized');
    
    const details = log.details ? JSON.stringify(log.details) : null;
    
    const result = await this.db.run(`
      INSERT INTO logs (level, message, details)
      VALUES (?, ?, ?)
    `, log.level, log.message, details);
    
    return {
      ...log,
      id: result.lastID!,
      timestamp: new Date()
    } as Log;
  }

  async clearLogs(): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.run(`DELETE FROM logs`);
    return true;
  }

  // User operations (from original)
  async getUser(id: number): Promise<User | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    const user = await this.db.get(`SELECT * FROM users WHERE id = ?`, id);
    return user as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    const user = await this.db.get(`SELECT * FROM users WHERE username = ?`, username);
    return user as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.run(`
      INSERT INTO users (username, password)
      VALUES (?, ?)
    `, insertUser.username, insertUser.password);
    
    return {
      ...insertUser,
      id: result.lastID!
    } as User;
  }
}

// Determine which storage to use
let storage: IStorage;

// Initialize SQLite storage if in production
if (process.env.NODE_ENV === 'production') {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'steam_inventory.db');
  const sqliteStorage = new SQLiteStorage(dbPath);
  
  // Initialize the database
  sqliteStorage.initialize().then(() => {
    console.log('SQLite database initialized');
  }).catch(err => {
    console.error('Error initializing SQLite database:', err);
    // Fallback to memory storage if database initialization fails
    storage = new MemStorage();
  });
  
  storage = sqliteStorage;
} else {
  // Use in-memory storage for development
  storage = new MemStorage();
}

export { storage };
