import { apiRequest } from "./queryClient";

export interface SteamProfile {
  steamId: string;
  profileInfo: {
    nickname: string;
    profileUrl: string;
    avatarUrl: string;
    isPrivate: boolean;
  } | null;
}

export class SteamAPI {
  // Resolve SteamID from custom URL or profile URL
  static async resolveSteamId(identifier: string): Promise<SteamProfile> {
    try {
      const response = await fetch(`/api/resolve-steamid?identifier=${encodeURIComponent(identifier)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve Steam ID');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error resolving Steam ID:", error);
      throw error;
    }
  }
  
  // Add a new Steam account
  static async addAccount(steamId: string, nickname?: string): Promise<any> {
    try {
      const response = await apiRequest('POST', '/api/accounts', { 
        steamId, 
        nickname: nickname || undefined 
      });
      
      return await response.json();
    } catch (error) {
      console.error("Error adding account:", error);
      throw error;
    }
  }
  
  // Remove a Steam account
  static async removeAccount(id: number): Promise<void> {
    try {
      await apiRequest('DELETE', `/api/accounts/${id}`);
    } catch (error) {
      console.error("Error removing account:", error);
      throw error;
    }
  }
  
  // Refresh inventory for a specific account
  static async refreshAccount(id: number): Promise<any> {
    try {
      const response = await apiRequest('POST', `/api/accounts/${id}/refresh`);
      return await response.json();
    } catch (error) {
      console.error("Error refreshing account:", error);
      throw error;
    }
  }
  
  // Refresh all accounts
  static async refreshAllAccounts(): Promise<any> {
    try {
      const response = await apiRequest('POST', '/api/accounts/refresh-all');
      return await response.json();
    } catch (error) {
      console.error("Error refreshing all accounts:", error);
      throw error;
    }
  }
  
  // Save Steam API key
  static async saveApiKey(apiKey: string): Promise<any> {
    try {
      const response = await apiRequest('POST', '/api/settings/api-key', { apiKey });
      return await response.json();
    } catch (error) {
      console.error("Error saving API key:", error);
      throw error;
    }
  }
  
  // Check if API key is set
  static async checkApiKey(): Promise<{ hasApiKey: boolean; preview: string }> {
    try {
      const response = await fetch('/api/settings/api-key');
      
      if (!response.ok) {
        throw new Error('Failed to check API key');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error checking API key:", error);
      throw error;
    }
  }
}
