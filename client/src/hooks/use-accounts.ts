import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type Account = {
  id: number;
  steamId: string;
  nickname?: string;
  profileUrl?: string;
  avatarUrl?: string;
  isPrivate: boolean;
  lastUpdated: string;
};

export type AccountSummary = {
  id: number;
  steamId: string;
  nickname?: string;
  profileUrl?: string;
  avatarUrl?: string;
  isPrivate: boolean;
  lastUpdated: string;
  casesCount: number;
  totalValue: number;
  formattedValue: string;
};

export const useAccounts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch all accounts
  const { 
    data: accounts = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });
  
  // Fetch account details with case count and value
  const useAccountsWithSummary = () => {
    const { data: cases = [] } = useQuery<any[]>({
      queryKey: ['/api/cases'],
    });

    // Calculate summary data for each account
    if (!isLoading && !isError && accounts && cases) {
      return accounts.map(account => {
        const accountCases = cases.filter(c => c.accountId === account.id);
        const casesCount = accountCases.reduce((sum, c) => sum + c.quantity, 0);
        
        const totalValue = accountCases.reduce((sum, c) => {
          if (c.price) {
            return sum + (c.price * c.quantity);
          }
          return sum;
        }, 0);
        
        // Format the value as a currency string
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        });
        const formattedValue = formatter.format(totalValue);
        
        return {
          ...account,
          casesCount,
          totalValue,
          formattedValue
        };
      });
    }
    
    return [];
  };
  
  // Add account mutation
  const addAccount = useMutation({
    mutationFn: async ({ steamId, nickname }: { steamId: string; nickname?: string }) => {
      return await apiRequest('POST', '/api/accounts', { steamId, nickname });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
      toast({
        title: "Account Added",
        description: "Steam account has been added successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error adding account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add account",
        variant: "destructive",
      });
    }
  });
  
  // Delete account mutation
  const deleteAccount = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
      toast({
        title: "Account Removed",
        description: "Steam account has been removed successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error removing account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove account",
        variant: "destructive",
      });
    }
  });
  
  // Refresh account mutation
  const refreshAccount = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('POST', `/api/accounts/${id}/refresh`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
      toast({
        title: "Inventory Refreshed",
        description: "Account inventory has been refreshed successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error refreshing account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to refresh account inventory",
        variant: "destructive",
      });
    }
  });
  
  // Resolve Steam ID from custom URL or ID
  const resolveSteamId = useMutation({
    mutationFn: async (identifier: string) => {
      const response = await fetch(`/api/resolve-steamid?identifier=${encodeURIComponent(identifier)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve Steam ID');
      }
      return response.json();
    }
  });
  
  return {
    accounts,
    useAccountsWithSummary,
    isLoading,
    isError,
    error,
    refetch,
    addAccount,
    deleteAccount,
    refreshAccount,
    resolveSteamId
  };
};
