import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AppContextType = {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  checkApiKey: () => Promise<void>;
  isLoading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  refreshAllAccounts: () => Promise<void>;
  isRefreshingAll: boolean;
  selectedAccountId: number | null;
  setSelectedAccountId: (id: number | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Get API key status
  const { 
    data: apiKeyData, 
    isLoading: apiKeyLoading,
    refetch: refetchApiKey
  } = useQuery({
    queryKey: ['/api/settings/api-key'],
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Check if API key is set on app startup
  useEffect(() => {
    if (apiKeyData?.hasApiKey) {
      setApiKeyState("********");
    }
  }, [apiKeyData]);

  // Set API key
  const setApiKey = async (key: string) => {
    try {
      const response = await apiRequest("POST", "/api/settings/api-key", { apiKey: key });
      const data = await response.json();
      
      setApiKeyState(key);
      toast({
        title: "Success",
        description: "API key has been saved successfully",
      });
      
      // Invalidate API key cache
      await queryClient.invalidateQueries({ queryKey: ['/api/settings/api-key'] });
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  // Check if API key is valid
  const checkApiKey = async () => {
    await refetchApiKey();
  };

  // Refresh all accounts
  const refreshAllAccounts = async () => {
    try {
      setIsRefreshingAll(true);
      toast({
        title: "Processing",
        description: "Starting refresh for all accounts...",
      });
      
      const response = await apiRequest("POST", "/api/accounts/refresh-all");
      const data = await response.json();
      
      // Invalidate relevant caches
      await queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/summary'] });
      
      toast({
        title: "Success",
        description: `All accounts refreshed successfully`,
      });
    } catch (error) {
      console.error("Error refreshing accounts:", error);
      toast({
        title: "Error",
        description: "Failed to refresh accounts",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingAll(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        apiKey,
        setApiKey,
        checkApiKey,
        isLoading: apiKeyLoading,
        activeSection,
        setActiveSection,
        refreshAllAccounts,
        isRefreshingAll,
        selectedAccountId,
        setSelectedAccountId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
