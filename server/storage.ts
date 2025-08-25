import { accounts, type Account, type InsertAccount, cases, type Case, type InsertCase, settings, type Settings, type InsertSettings, logs, type Log, type InsertLog, users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

// PostgreSQL storage implementation
export class DatabaseStorage implements IStorage {
  // Account operations
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async getAccountBySteamId(steamId: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.steamId, steamId));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...accountUpdate, lastUpdated: new Date().toISOString() })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount || undefined;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return result.changes > 0;
  }

  // Case operations
  async getCases(accountId?: number): Promise<Case[]> {
    if (accountId) {
      return await db.select().from(cases).where(eq(cases.accountId, accountId));
    }
    return await db.select().from(cases);
  }

  async getCase(id: number): Promise<Case | undefined> {
    const [caseItem] = await db.select().from(cases).where(eq(cases.id, id));
    return caseItem || undefined;
  }

  async createCase(caseItem: InsertCase): Promise<Case> {
    const [newCase] = await db.insert(cases).values(caseItem).returning();
    return newCase;
  }

  async updateCase(id: number, caseUpdate: Partial<Case>): Promise<Case | undefined> {
    const [updatedCase] = await db
      .update(cases)
      .set({ ...caseUpdate, lastUpdated: new Date().toISOString() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase || undefined;
  }

  async upsertCase(caseItem: InsertCase): Promise<Case> {
    const [existingCase] = await db
      .select()
      .from(cases)
      .where(and(
        eq(cases.accountId, caseItem.accountId),
        eq(cases.appId, caseItem.appId),
        eq(cases.assetId, caseItem.assetId)
      ));

    if (existingCase) {
      const [updated] = await db
        .update(cases)
        .set({ ...caseItem, lastUpdated: new Date().toISOString() })
        .where(eq(cases.id, existingCase.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(cases).values(caseItem).returning();
      return created;
    }
  }

  async deleteCase(id: number): Promise<boolean> {
    const result = await db.delete(cases).where(eq(cases.id, id));
    return result.changes > 0;
  }

  async deleteCasesByAccountId(accountId: number): Promise<boolean> {
    await db.delete(cases).where(eq(cases.accountId, accountId));
    return true;
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    const [settingsRecord] = await db.select().from(settings).limit(1);
    if (!settingsRecord) return undefined;
    
    // Parse userAgents JSON string back to array for compatibility
    return {
      ...settingsRecord,
      userAgents: JSON.parse(settingsRecord.userAgents || '[]')
    } as Settings;
  }

  async saveSettings(newSettings: InsertSettings): Promise<Settings> {
    const existingSettings = await this.getSettings();
    
    // Convert userAgents array to JSON string if it's an array
    const settingsToSave = {
      ...newSettings,
      userAgents: typeof newSettings.userAgents === 'string' 
        ? newSettings.userAgents 
        : JSON.stringify(newSettings.userAgents || [])
    };
    
    if (existingSettings) {
      const [updated] = await db
        .update(settings)
        .set(settingsToSave)
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return {
        ...updated,
        userAgents: JSON.parse(updated.userAgents || '[]')
      } as Settings;
    } else {
      const [created] = await db.insert(settings).values(settingsToSave).returning();
      return {
        ...created,
        userAgents: JSON.parse(created.userAgents || '[]')
      } as Settings;
    }
  }

  async updateSettings(settingsUpdate: Partial<Settings>): Promise<Settings | undefined> {
    const existingSettings = await this.getSettings();
    
    if (!existingSettings) return undefined;
    
    const [updated] = await db
      .update(settings)
      .set(settingsUpdate)
      .where(eq(settings.id, existingSettings.id))
      .returning();
    return updated || undefined;
  }

  // Log operations
  async getLogs(limit: number): Promise<Log[]> {
    return await db.select().from(logs).orderBy(logs.timestamp).limit(limit);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db.insert(logs).values(log).returning();
    return newLog;
  }

  async clearLogs(): Promise<boolean> {
    await db.delete(logs);
    return true;
  }

  // User operations (from original)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
}

export const storage = new DatabaseStorage();

// Initialize default settings
async function initializeDefaultSettings() {
  try {
    const existingSettings = await storage.getSettings();
    if (!existingSettings) {
      await storage.saveSettings({
        currency: 'USD',
        requestDelay: 2000,
        userAgents: JSON.stringify([
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ])
      });
      console.log('Default settings initialized');
    }
  } catch (error) {
    console.log('Settings initialization error:', error);
  }
}

// Run initialization
initializeDefaultSettings();