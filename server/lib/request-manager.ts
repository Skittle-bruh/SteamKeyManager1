import fetch, { Response } from 'node-fetch';
import { storage } from '../storage';

export class RequestManager {
  private lastRequestTime: number = 0;
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
  ];
  private maxRequestsPerMinute: number = 20;
  private requestsThisMinute: number = 0;
  private minuteStartTime: number = Date.now();
  
  constructor() {
    // Initialize user agents from settings when available
    this.loadUserAgents();
  }
  
  private async loadUserAgents(): Promise<void> {
    try {
      const settings = await storage.getSettings();
      if (settings && settings.userAgents && settings.userAgents.length > 0) {
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
    // Random delay between 1.5 and 4 seconds
    return Math.floor(Math.random() * 2500) + 1500;
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async enforceRateLimit(): Promise<void> {
    // Reset counter if a minute has passed
    const now = Date.now();
    if (now - this.minuteStartTime > 60000) {
      this.requestsThisMinute = 0;
      this.minuteStartTime = now;
    }
    
    // Check if we've reached the rate limit
    if (this.requestsThisMinute >= this.maxRequestsPerMinute) {
      const timeToWait = 60000 - (now - this.minuteStartTime) + 100; // Add 100ms buffer
      console.log(`Rate limit reached, waiting ${timeToWait}ms before next request`);
      await this.delay(timeToWait);
      
      // Reset after waiting
      this.requestsThisMinute = 0;
      this.minuteStartTime = Date.now();
    }
    
    // Human-like delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    const settings = await storage.getSettings();
    const requestDelay = settings?.requestDelay || 2000;
    
    // Ensure minimum delay between requests (either configured or random)
    const minDelay = requestDelay || this.getRandomDelay();
    if (timeSinceLastRequest < minDelay) {
      await this.delay(minDelay - timeSinceLastRequest);
    }
  }
  
  async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    await this.enforceRateLimit();
    
    // Log the request (only domain and path, not query parameters with API keys)
    const urlObj = new URL(url);
    await storage.createLog({
      level: 'info',
      message: 'API Request',
      details: { url: `${urlObj.origin}${urlObj.pathname}` }
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
      this.requestsThisMinute++;
      
      const response = await fetch(url, options);
      
      // Handle common errors
      if (!response.ok) {
        if (response.status === 429) {
          // Too many requests - wait longer and retry
          console.log('Rate limited by server, waiting 30 seconds...');
          await this.delay(30000);
          return this.makeRequest(url, options);
        }
        
        // Log error response
        await storage.createLog({
          level: 'error',
          message: 'API Error Response',
          details: { 
            url: `${urlObj.origin}${urlObj.pathname}`,
            status: response.status,
            statusText: response.statusText
          }
        });
      }
      
      return response;
    } catch (error) {
      // Log fetch error
      await storage.createLog({
        level: 'error',
        message: 'API Request Failed',
        details: { 
          url: `${urlObj.origin}${urlObj.pathname}`,
          error: (error as Error).message
        }
      });
      
      // Throw the error to be handled by caller
      throw error;
    }
  }
}
