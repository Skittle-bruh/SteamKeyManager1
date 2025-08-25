import fetch, { Response } from 'node-fetch';
import { storage } from '../storage';

export class RequestManager {
  private lastRequestTime: number = 0;
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
  ];
  // Steam 2025 inventory API limits: ~3-10 requests per 30 minutes
  private maxInventoryRequestsPer30Min: number = 5;
  private inventoryRequestsThisPeriod: number = 0;
  private periodStartTime: number = Date.now();
  private readonly INVENTORY_PERIOD_MS = 30 * 60 * 1000; // 30 minutes
  private retryAttempts: Map<string, number> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  
  constructor() {
    // Initialize user agents from settings when available
    this.loadUserAgents();
  }
  
  private async loadUserAgents(): Promise<void> {
    try {
      const settings = await storage.getSettings();
      if (settings && settings.userAgents && Array.isArray(settings.userAgents) && settings.userAgents.length > 0) {
        this.userAgents = settings.userAgents;
      }
    } catch (error) {
      console.error('Error loading user agents from settings:', error);
    }
  }
  
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
  
  private getRandomDelay(): number {
    // Random delay between 2 and 5 seconds (increased for Steam 2025)
    return Math.floor(Math.random() * 3000) + 2000;
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async enforceRateLimit(url: string): Promise<void> {
    const isInventoryRequest = url.includes('/inventory/');
    const now = Date.now();
    
    // Reset counter if period has passed
    if (now - this.periodStartTime > this.INVENTORY_PERIOD_MS) {
      this.inventoryRequestsThisPeriod = 0;
      this.periodStartTime = now;
    }
    
    // Special handling for inventory requests (Steam 2025 limits)
    if (isInventoryRequest) {
      if (this.inventoryRequestsThisPeriod >= this.maxInventoryRequestsPer30Min) {
        const timeToWait = this.INVENTORY_PERIOD_MS - (now - this.periodStartTime) + 60000; // Add 1 min buffer
        await this.delay(timeToWait);
        
        // Reset after waiting
        this.inventoryRequestsThisPeriod = 0;
        this.periodStartTime = Date.now();
      }
    }
    
    // Human-like delay between requests (longer for inventory)
    const timeSinceLastRequest = now - this.lastRequestTime;
    const settings = await storage.getSettings();
    const baseDelay = settings?.requestDelay || 2000;
    
    // Increase delay for inventory requests to 8-15 seconds (Steam 2025)
    const minDelay = isInventoryRequest 
      ? Math.max(8000, baseDelay * 4) + this.getRandomDelay() 
      : baseDelay;
    
    if (timeSinceLastRequest < minDelay) {
      await this.delay(minDelay - timeSinceLastRequest);
    }
  }
  
  async makeRequest(url: string, options: any = {}): Promise<Response> {
    await this.enforceRateLimit(url);
    
    const requestKey = new URL(url).pathname;
    const currentAttempts = this.retryAttempts.get(requestKey) || 0;
    
    // Log the request (only domain and path, not query parameters with API keys)
    const urlObj = new URL(url);
    await storage.createLog({
      level: 'info',
      message: 'API Request',
      details: JSON.stringify({ url: `${urlObj.origin}${urlObj.pathname}` })
    });
    
    // Add random user agent if not provided
    if (!options.headers) {
      options.headers = {
        'User-Agent': this.getRandomUserAgent()
      };
    } else if (!Object.keys(options.headers).some(h => h.toLowerCase() === 'user-agent')) {
      options.headers = {
        ...options.headers,
        'User-Agent': this.getRandomUserAgent()
      };
    }
    
    try {
      this.lastRequestTime = Date.now();
      
      // Track inventory requests separately
      if (url.includes('/inventory/')) {
        this.inventoryRequestsThisPeriod++;
      }
      
      // Clear retry counter on success
      this.retryAttempts.delete(requestKey);
      
      const response = await fetch(url, options);
      
      // Handle common errors
      if (!response.ok) {
        if (response.status === 429) {
          // Too many requests - exponential backoff (Steam 2025)
          if (currentAttempts < this.MAX_RETRY_ATTEMPTS) {
            const backoffDelay = Math.min(300000, Math.pow(2, currentAttempts) * 60000); // Max 5 minutes
            
            this.retryAttempts.set(requestKey, currentAttempts + 1);
            await this.delay(backoffDelay);
            return this.makeRequest(url, options);
          } else {
            this.retryAttempts.delete(requestKey);
            throw new Error(`Rate limit exceeded after ${this.MAX_RETRY_ATTEMPTS} attempts. Steam API temporarily unavailable.`);
          }
        }
        
        // Log error response
        await storage.createLog({
          level: 'error',
          message: 'API Error Response',
          details: JSON.stringify({ 
            url: `${urlObj.origin}${urlObj.pathname}`,
            status: response.status,
            statusText: response.statusText
          })
        });
      }
      
      return response;
    } catch (error) {
      // Log fetch error
      await storage.createLog({
        level: 'error',
        message: 'API Request Failed',
        details: JSON.stringify({ 
          url: `${urlObj.origin}${urlObj.pathname}`,
          error: (error as Error).message
        })
      });
      
      // Throw the error to be handled by caller
      throw error;
    }
  }
}
