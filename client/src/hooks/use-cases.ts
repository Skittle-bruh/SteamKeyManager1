import { useQuery } from "@tanstack/react-query";

export type Case = {
  id: number;
  accountId: number;
  name: string;
  appId: string;
  assetId: string;
  classId: string;
  instanceId: string;
  marketHashName: string;
  imageUrl?: string;
  quantity: number;
  price: number | null;
  lastUpdated: string;
};

export type CaseSummary = {
  accountsCount: number;
  totalCases: number;
  totalValue: number;
  formattedValue: string;
  lastUpdated: string | null;
};

export const useCases = (accountId?: number) => {
  // Query for cases, optionally filtered by account
  const { 
    data: cases = [], 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery<Case[]>({
    queryKey: accountId 
      ? [`/api/cases?accountId=${accountId}`]
      : ['/api/cases'],
  });
  
  return {
    cases,
    isLoading,
    isError,
    error,
    refetch
  };
};

export const useCasesSummary = () => {
  // Query for dashboard summary
  const { 
    data: summary,
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery<CaseSummary>({
    queryKey: ['/api/summary'],
  });
  
  return {
    summary,
    isLoading,
    isError,
    error,
    refetch
  };
};
