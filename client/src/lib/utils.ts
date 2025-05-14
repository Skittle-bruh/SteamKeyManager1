import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date to a readable string
export function formatDate(date: Date | string | null): string {
  if (!date) return 'Never';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Format a number as a currency
export function formatCurrency(amount: number | null, currency = 'USD'): string {
  if (amount === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Determine if a URL is valid
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Clean a Steam identifier (handle URLs, IDs, etc.)
export function cleanSteamIdentifier(identifier: string): string {
  // Remove whitespace
  let cleaned = identifier.trim();
  
  // If it's a URL, extract the ID/vanity portion
  if (cleaned.includes('steamcommunity.com')) {
    // Extract the path after steamcommunity.com/id/ or steamcommunity.com/profiles/
    const matches = cleaned.match(/steamcommunity\.com\/(id|profiles)\/([^\/\?]+)/i);
    if (matches && matches[2]) {
      cleaned = matches[2];
    }
  }
  
  return cleaned;
}

// Generate a placeholder avatar
export function getPlaceholderAvatar(name?: string): string {
  if (!name) return 'https://ui-avatars.com/api/?name=S&background=0078d4&color=fff';
  
  // Use first letter of name
  const initial = name.charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${initial}&background=0078d4&color=fff`;
}
