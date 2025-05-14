import fetch from 'node-fetch';
import { RequestManager } from './request-manager';
import { storage } from '../storage';
import { InsertCase } from '@shared/schema';

// Constants for Steam API and item filtering
const STEAM_BASE_URL = 'https://steamcommunity.com';
const STEAM_API_BASE_URL = 'https://api.steampowered.com';
const CASE_IDENTIFIERS = [
  'Case', 'Weapon Case', 'Container', 'eSports Case', 'Operation'
];
const CSGO_APP_ID = '730';
const TF2_APP_ID = '440';
const DOTA2_APP_ID = '570';

// Helper to determine if an item is a case
function isCase(item: any): boolean {
  const name = item.name || item.market_hash_name || '';
  return CASE_IDENTIFIERS.some(identifier => 
    name.includes(identifier) && !name.includes('Key') && !name.includes('Graffiti')
  );
}

export class SteamParser {
  private requestManager: RequestManager;
  
  constructor() {
    this.requestManager = new RequestManager();
  }
  
  // Get Steam ID from profile URL or custom URL
  async getSteamId(identifier: string): Promise<string | null> {
    // If it's already a SteamID (STEAM_0:X:XXXXXXXX format)
    if (/^STEAM_[0-5]:[01]:\d+$/.test(identifier)) {
      return identifier;
    }
    
    // If it's a 64-bit SteamID (76561XXXXXXXXX format)
    if (/^7656119\d{10}$/.test(identifier)) {
      return this.convertSteamID64ToSteamID(identifier);
    }
    
    // If it's a custom URL, resolve it
    try {
      const settings = await storage.getSettings();
      const apiKey = settings?.steamApiKey;
      
      if (!apiKey) {
        throw new Error('Steam API key not configured');
      }
      
      // Clean the identifier to ensure it's just the vanity URL part
      let vanityUrl = identifier.replace(/https?:\/\/steamcommunity.com\/(id|profiles)\//, '');
      vanityUrl = vanityUrl.split('/')[0]; // Remove any trailing path
      
      const url = `${STEAM_API_BASE_URL}/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${vanityUrl}`;
      const response = await this.requestManager.makeRequest(url);
      const data = await response.json();
      
      if (data.response && data.response.success === 1) {
        return this.convertSteamID64ToSteamID(data.response.steamid);
      } else {
        throw new Error('Failed to resolve vanity URL: ' + (data.response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error resolving Steam ID:', error);
      await storage.createLog({ 
        level: 'error', 
        message: 'Failed to resolve Steam ID',
        details: { identifier, error: (error as Error).message }
      });
      return null;
    }
  }
  
  // Convert 64-bit SteamID to STEAM_X:Y:Z format
  private convertSteamID64ToSteamID(steamID64: string): string {
    const steamID64Num = BigInt(steamID64);
    const universe = Number((steamID64Num >> 56n) & 0xFFn);
    const accountIdLow = Number(steamID64Num & 0xFFFFFFFFn);
    
    const y = accountIdLow & 1;
    const z = accountIdLow >> 1;
    
    return `STEAM_${universe}:${y}:${z}`;
  }
  
  // Get profile information for a Steam ID
  async getProfileInfo(steamId: string): Promise<{ 
    nickname: string, 
    profileUrl: string, 
    avatarUrl: string, 
    isPrivate: boolean 
  } | null> {
    try {
      const settings = await storage.getSettings();
      const apiKey = settings?.steamApiKey;
      
      if (!apiKey) {
        throw new Error('Steam API key not configured');
      }
      
      // Convert STEAM_X:Y:Z to 64-bit SteamID for API calls
      const steamID64 = this.convertSteamIDToSteamID64(steamId);
      
      const url = `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamID64}`;
      const response = await this.requestManager.makeRequest(url);
      const data = await response.json();
      
      if (data.response && data.response.players && data.response.players.length > 0) {
        const player = data.response.players[0];
        return {
          nickname: player.personaname,
          profileUrl: player.profileurl,
          avatarUrl: player.avatarmedium,
          isPrivate: player.communityvisibilitystate !== 3
        };
      } else {
        throw new Error('Player not found or API returned no data');
      }
    } catch (error) {
      console.error('Error getting profile info:', error);
      await storage.createLog({ 
        level: 'error', 
        message: 'Failed to get profile info',
        details: { steamId, error: (error as Error).message }
      });
      return null;
    }
  }
  
  // Convert STEAM_X:Y:Z to 64-bit SteamID
  private convertSteamIDToSteamID64(steamID: string): string {
    const parts = steamID.match(/^STEAM_(\d+):([01]):(\d+)$/);
    if (!parts) {
      throw new Error('Invalid SteamID format');
    }
    
    const universe = BigInt(parts[1]);
    const y = BigInt(parts[2]);
    const z = BigInt(parts[3]);
    
    const accountID = z * 2n + y;
    const steamID64 = (universe << 56n) | 0x0110000100000000n | accountID;
    
    return steamID64.toString();
  }
  
  // Get inventory items for a Steam account
  async getInventory(accountId: number, steamId: string, appId = CSGO_APP_ID): Promise<InsertCase[]> {
    try {
      // Convert STEAM_X:Y:Z to 64-bit SteamID for inventory requests
      const steamID64 = this.convertSteamIDToSteamID64(steamId);
      
      // First, try using Steam web API via HTTP GET
      const url = `${STEAM_BASE_URL}/inventory/${steamID64}/${appId}/2?l=english&count=5000`;
      const response = await this.requestManager.makeRequest(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Inventory is private or unavailable');
        }
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.assets || !data.descriptions) {
        throw new Error('Failed to parse inventory data');
      }
      
      // Process inventory data to extract cases
      const cases: InsertCase[] = [];
      const descriptions = new Map();
      
      // Create a map of descriptions by class_id and instance_id
      data.descriptions.forEach((desc: any) => {
        const key = `${desc.classid}_${desc.instanceid}`;
        descriptions.set(key, desc);
      });
      
      // Process assets and match with descriptions
      for (const asset of data.assets) {
        const key = `${asset.classid}_${asset.instanceid}`;
        const desc = descriptions.get(key);
        
        if (desc && isCase(desc)) {
          cases.push({
            accountId,
            name: desc.name,
            appId: appId,
            assetId: asset.assetid,
            classId: asset.classid,
            instanceId: asset.instanceid,
            marketHashName: desc.market_hash_name,
            imageUrl: `https://steamcommunity-a.akamaihd.net/economy/image/${desc.icon_url}/128x128`,
            quantity: parseInt(asset.amount, 10) || 1,
            price: null // Price will be fetched separately
          });
        }
      }
      
      return cases;
    } catch (error) {
      console.error('Error parsing inventory:', error);
      await storage.createLog({ 
        level: 'error', 
        message: 'Failed to parse inventory',
        details: { accountId, steamId, appId, error: (error as Error).message }
      });
      
      // Update account to mark it as private if that's the error
      if ((error as Error).message.includes('private')) {
        await storage.updateAccount(accountId, { isPrivate: true });
      }
      
      return [];
    }
  }
}
