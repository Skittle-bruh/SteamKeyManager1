import fetch from 'node-fetch';
import { RequestManager } from './request-manager';
import { storage } from '../storage';

// Steam market URLs
const STEAM_MARKET_URL = 'https://steamcommunity.com/market/priceoverview/';

export class MarketPrice {
  private requestManager: RequestManager;
  private priceCache: Map<string, { price: number, timestamp: number }>;
  private CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds (Steam 2025 - longer cache)
  
  constructor() {
    this.requestManager = new RequestManager();
    this.priceCache = new Map();
  }
  
  // Get the current price for a market item
  async getItemPrice(appId: string, marketHashName: string, currency = 1): Promise<number | null> {
    try {
      // Generate a cache key for this item
      const cacheKey = `${appId}_${marketHashName}_${currency}`;
      
      // Check if we have a cached price that's still valid
      const cachedPrice = this.priceCache.get(cacheKey);
      if (cachedPrice && (Date.now() - cachedPrice.timestamp) < this.CACHE_DURATION) {
        return cachedPrice.price;
      }
      
      // Fetch current price from Steam Market
      const url = `${STEAM_MARKET_URL}?appid=${appId}&currency=${currency}&market_hash_name=${encodeURIComponent(marketHashName)}`;
      const response = await this.requestManager.makeRequest(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      if (!data.success) {
        throw new Error('Failed to get price data');
      }
      
      let price: number | null = null;
      
      // Parse the price string from Steam Market
      if (data.lowest_price) {
        price = this.parsePriceString(data.lowest_price);
      } else if (data.median_price) {
        price = this.parsePriceString(data.median_price);
      }
      
      // Cache the price
      if (price !== null) {
        this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
      }
      
      return price;
    } catch (error) {
      console.error('Error getting market price:', error);
      await storage.createLog({ 
        level: 'error', 
        message: 'Failed to get market price',
        details: { appId, marketHashName, error: (error as Error).message }
      });
      return null;
    }
  }
  
  // Parse price string from Steam Market (different formats by currency)
  private parsePriceString(priceString: string): number {
    // Remove currency symbols and formatting
    let cleanedPrice = priceString.replace(/[^\d.,]/g, '');
    
    // Handle different decimal separators
    if (cleanedPrice.includes(',') && cleanedPrice.includes('.')) {
      // If both , and . are present, the one furthest to the right is the decimal separator
      const lastCommaIndex = cleanedPrice.lastIndexOf(',');
      const lastDotIndex = cleanedPrice.lastIndexOf('.');
      
      if (lastCommaIndex > lastDotIndex) {
        // Comma is the decimal separator
        cleanedPrice = cleanedPrice.replace(/\./g, '').replace(',', '.');
      } else {
        // Dot is the decimal separator
        cleanedPrice = cleanedPrice.replace(/,/g, '');
      }
    } else if (cleanedPrice.includes(',')) {
      // Only comma is present, assume it's the decimal separator
      cleanedPrice = cleanedPrice.replace(',', '.');
    }
    
    return parseFloat(cleanedPrice);
  }
  
  // Convert currency code to Steam currency ID
  getCurrencyId(currencyCode: string): number {
    const currencyMap: Record<string, number> = {
      'USD': 1,
      'GBP': 2,
      'EUR': 3,
      'CHF': 4,
      'RUB': 5,
      'PLN': 6,
      'BRL': 7,
      'JPY': 8,
      'NOK': 9,
      'IDR': 10,
      'MYR': 11,
      'PHP': 12,
      'SGD': 13,
      'THB': 14,
      'VND': 15,
      'KRW': 16,
      'TRY': 17,
      'UAH': 18,
      'MXN': 19,
      'CAD': 20,
      'AUD': 21,
      'NZD': 22,
      'CNY': 23,
      'INR': 24,
      'CLP': 25,
      'PEN': 26,
      'COP': 27,
      'ZAR': 28,
      'HKD': 29,
      'TWD': 30,
      'SAR': 31,
      'AED': 32,
      'SEK': 33,
      'ARS': 34,
      'ILS': 35,
      'BYN': 36,
      'KZT': 37,
      'KWD': 38,
      'QAR': 39,
      'CRC': 40,
      'UYU': 41,
      'BGN': 42,
      'HRK': 43,
      'CZK': 44,
      'DKK': 45,
      'HUF': 46,
      'RON': 47
    };
    
    return currencyMap[currencyCode] || 1; // Default to USD if not found
  }
  
  // Format price with currency symbol
  formatPrice(price: number | null, currencyCode = 'USD'): string {
    if (price === null) return 'N/A';
    
    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return currencyFormatter.format(price);
  }
}
