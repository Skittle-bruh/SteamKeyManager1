import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SteamParser } from "./lib/steam-parser";
import { MarketPrice } from "./lib/market-price";
import { z } from "zod";
import { insertAccountSchema, insertCaseSchema, insertSettingsSchema, insertLogSchema } from "@shared/schema";

// Initialize services
const steamParser = new SteamParser();
const marketPrice = new MarketPrice();

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Account routes
  app.get('/api/accounts', async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  });

  app.get('/api/accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid account ID' });
      }
      
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.json(account);
    } catch (error) {
      console.error('Error fetching account:', error);
      res.status(500).json({ error: 'Failed to fetch account' });
    }
  });

  app.post('/api/accounts', async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertAccountSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: 'Invalid account data', details: validatedData.error });
      }
      
      // Check if account already exists
      const existingAccount = await storage.getAccountBySteamId(validatedData.data.steamId);
      if (existingAccount) {
        return res.status(409).json({ error: 'Account with this Steam ID already exists' });
      }
      
      // Create account
      const newAccount = await storage.createAccount(validatedData.data);
      
      // Log account creation
      await storage.createLog({
        level: 'info',
        message: 'Account created',
        details: JSON.stringify({ accountId: newAccount.id, steamId: newAccount.steamId })
      });
      
      res.status(201).json(newAccount);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  app.delete('/api/accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid account ID' });
      }
      
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      // Delete account and all associated cases
      await storage.deleteAccount(id);
      
      // Log account deletion
      await storage.createLog({
        level: 'info',
        message: 'Account deleted',
        details: JSON.stringify({ accountId: id, steamId: account.steamId })
      });
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  // Resolve Steam ID from custom URL
  app.get('/api/resolve-steamid', async (req, res) => {
    try {
      const identifier = req.query.identifier as string;
      if (!identifier) {
        return res.status(400).json({ error: 'Missing identifier parameter' });
      }
      
      const steamId = await steamParser.getSteamId(identifier);
      if (!steamId) {
        return res.status(404).json({ error: 'Could not resolve Steam ID' });
      }
      
      // Get profile info
      const profileInfo = await steamParser.getProfileInfo(steamId);
      
      res.json({ 
        steamId,
        profileInfo
      });
    } catch (error) {
      console.error('Error resolving Steam ID:', error);
      res.status(500).json({ error: 'Failed to resolve Steam ID' });
    }
  });

  // Case operations
  app.get('/api/cases', async (req, res) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      
      const cases = await storage.getCases(accountId);
      res.json(cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
      res.status(500).json({ error: 'Failed to fetch cases' });
    }
  });

  // Refresh inventory for an account
  app.post('/api/accounts/:id/refresh', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid account ID' });
      }
      
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      // Log refresh start
      await storage.createLog({
        level: 'info',
        message: 'Starting inventory refresh',
        details: JSON.stringify({ accountId: id, steamId: account.steamId })
      });
      
      // Get inventory items
      const cases = await steamParser.getInventory(id, account.steamId);
      
      // Update prices for all cases
      const settings = await storage.getSettings();
      const currency = settings?.currency || 'USD';
      const currencyId = marketPrice.getCurrencyId(currency);
      
      // Track success
      let successCount = 0;
      let errorCount = 0;
      
      // Process each case
      for (const caseItem of cases) {
        try {
          // Get current price
          const price = await marketPrice.getItemPrice(caseItem.appId, caseItem.marketHashName, currencyId);
          caseItem.price = price;
          
          // Save to database
          await storage.upsertCase(caseItem);
          successCount++;
        } catch (error) {
          console.error('Error processing case:', error);
          errorCount++;
        }
      }
      
      // Update account lastUpdated
      await storage.updateAccount(id, { lastUpdated: new Date().toISOString() });
      
      // Log refresh completion
      await storage.createLog({
        level: 'info',
        message: 'Inventory refresh completed',
        details: JSON.stringify({ 
          accountId: id, 
          steamId: account.steamId,
          casesFound: cases.length,
          successCount,
          errorCount
        })
      });
      
      res.json({ 
        success: true, 
        message: 'Inventory refreshed successfully',
        totalCases: cases.length,
        successCount,
        errorCount
      });
    } catch (error) {
      console.error('Error refreshing inventory:', error);
      
      // Log error
      await storage.createLog({
        level: 'error',
        message: 'Inventory refresh failed',
        details: JSON.stringify({ accountId: req.params.id, error: (error as Error).message })
      });
      
      res.status(500).json({ 
        error: 'Failed to refresh inventory', 
        message: (error as Error).message 
      });
    }
  });

  // Refresh all accounts
  app.post('/api/accounts/refresh-all', async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      
      // Log refresh start
      await storage.createLog({
        level: 'info',
        message: 'Starting refresh for all accounts',
        details: JSON.stringify({ accountCount: accounts.length })
      });
      
      // Track results
      const results = [];
      
      // Process each account
      for (const account of accounts) {
        try {
          // Skip private accounts
          if (account.isPrivate) {
            results.push({
              accountId: account.id,
              steamId: account.steamId,
              nickname: account.nickname,
              status: 'skipped',
              reason: 'Private inventory'
            });
            continue;
          }
          
          // Get inventory items
          const cases = await steamParser.getInventory(account.id, account.steamId);
          
          // Update prices for all cases
          const settings = await storage.getSettings();
          const currency = settings?.currency || 'USD';
          const currencyId = marketPrice.getCurrencyId(currency);
          
          // Process each case
          for (const caseItem of cases) {
            // Get current price
            const price = await marketPrice.getItemPrice(caseItem.appId, caseItem.marketHashName, currencyId);
            caseItem.price = price;
            
            // Save to database
            await storage.upsertCase(caseItem);
          }
          
          // Update account lastUpdated
          await storage.updateAccount(account.id, { lastUpdated: new Date().toISOString() });
          
          results.push({
            accountId: account.id,
            steamId: account.steamId,
            nickname: account.nickname,
            status: 'success',
            casesFound: cases.length
          });
        } catch (error) {
          console.error(`Error refreshing account ${account.id}:`, error);
          
          results.push({
            accountId: account.id,
            steamId: account.steamId,
            nickname: account.nickname,
            status: 'error',
            error: (error as Error).message
          });
        }
      }
      
      // Log refresh completion
      await storage.createLog({
        level: 'info',
        message: 'Refresh all accounts completed',
        details: JSON.stringify({ results })
      });
      
      res.json({ 
        success: true, 
        message: 'All accounts refreshed',
        results
      });
    } catch (error) {
      console.error('Error refreshing all accounts:', error);
      
      // Log error
      await storage.createLog({
        level: 'error',
        message: 'Refresh all accounts failed',
        details: JSON.stringify({ error: (error as Error).message })
      });
      
      res.status(500).json({ 
        error: 'Failed to refresh accounts', 
        message: (error as Error).message 
      });
    }
  });

  // Settings routes
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      // Mask API key in response
      const maskedSettings = {
        ...settings,
        steamApiKey: settings.steamApiKey ? '********' : ''
      };
      
      res.json(maskedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertSettingsSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: 'Invalid settings data', details: validatedData.error });
      }
      
      // Save settings
      const settings = await storage.saveSettings(validatedData.data);
      
      // Log settings update
      await storage.createLog({
        level: 'info',
        message: 'Settings updated',
        details: JSON.stringify({ 
          currency: settings.currency, 
          requestDelay: settings.requestDelay,
          apiKeyUpdated: !!settings.steamApiKey
        })
      });
      
      // Mask API key in response
      const maskedSettings = {
        ...settings,
        steamApiKey: settings.steamApiKey ? '********' : ''
      };
      
      res.status(200).json(maskedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // Get API key (for verification)
  app.get('/api/settings/api-key', async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      res.json({ 
        hasApiKey: !!settings.steamApiKey,
        // Include last 4 characters if available
        preview: settings.steamApiKey ? 
          `****${settings.steamApiKey.slice(-4)}` : ''
      });
    } catch (error) {
      console.error('Error fetching API key:', error);
      res.status(500).json({ error: 'Failed to fetch API key' });
    }
  });

  // Update API key
  app.post('/api/settings/api-key', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }
      
      // Get current settings
      let settings = await storage.getSettings();
      
      if (!settings) {
        // Create settings if they don't exist
        settings = await storage.saveSettings({
          steamApiKey: apiKey,
          currency: 'USD',
          requestDelay: 2000,
          userAgents: JSON.stringify([
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
          ])
        });
      } else {
        // Update existing settings
        settings = await storage.updateSettings({ steamApiKey: apiKey }) as typeof settings;
      }
      
      // Log API key update
      await storage.createLog({
        level: 'info',
        message: 'API key updated'
      });
      
      res.json({ 
        success: true, 
        message: 'API key updated successfully',
        preview: `****${apiKey.slice(-4)}`
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'Failed to update API key' });
    }
  });

  // Logs routes
  app.get('/api/logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // Clear logs
  app.delete('/api/logs', async (req, res) => {
    try {
      await storage.clearLogs();
      res.status(204).end();
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({ error: 'Failed to clear logs' });
    }
  });

  // Summary endpoint for dashboard
  app.get('/api/summary', async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      const cases = await storage.getCases();
      
      // Calculate totals
      let totalCases = 0;
      let totalValue = 0;
      
      cases.forEach(c => {
        totalCases += c.quantity;
        if (c.price) {
          totalValue += c.price * c.quantity;
        }
      });
      
      // Get most recent update time
      let lastUpdated = null;
      if (accounts.length > 0) {
        lastUpdated = accounts.reduce((latest, account) => {
          const accountDate = account.lastUpdated ? new Date(account.lastUpdated) : new Date(0);
          return accountDate > latest ? accountDate : latest;
        }, new Date(0));
      }
      
      // Format the value
      const settings = await storage.getSettings();
      const currency = settings?.currency || 'USD';
      const formattedValue = marketPrice.formatPrice(totalValue, currency);
      
      res.json({
        accountCount: accounts.length,
        totalCases,
        totalValue,
        formattedValue,
        lastUpdated
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ error: 'Failed to fetch summary' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
