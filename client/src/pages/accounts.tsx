import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccounts, AccountSummary } from "@/hooks/use-accounts";
import { AccountCard } from "@/components/account-card";
import { AccountDetails } from "@/components/account-details";
import { useAppContext } from "@/context/app-context";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Accounts() {
  const { accounts, useAccountsWithSummary, refreshAccount, deleteAccount, isLoading } = useAccounts();
  const { selectedAccountId, setSelectedAccountId } = useAppContext();
  const [refreshingAccountId, setRefreshingAccountId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const accountsWithSummary = useAccountsWithSummary();
  
  // Filter accounts based on search term
  const filteredAccounts = searchTerm.trim() === "" 
    ? accountsWithSummary 
    : accountsWithSummary.filter((account: AccountSummary) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (account.nickname?.toLowerCase().includes(searchLower) || false) ||
          account.steamId.toLowerCase().includes(searchLower)
        );
      });
  
  const handleRefreshAccount = async (id: number) => {
    setRefreshingAccountId(id);
    try {
      await refreshAccount.mutateAsync(id);
    } finally {
      setRefreshingAccountId(null);
    }
  };
  
  const handleDeleteAccount = async (id: number) => {
    await deleteAccount.mutateAsync(id);
    if (selectedAccountId === id) {
      setSelectedAccountId(null);
    }
  };
  
  const handleViewDetails = (id: number) => {
    setSelectedAccountId(id);
  };

  return (
    <MainLayout 
      title="Accounts" 
      description="Manage your Steam accounts"
      showAddAccount
    >
      {/* Search and Filter */}
      <div className="mb-6">
        <div className="relative">
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
        </div>
      </div>
      
      {isLoading ? (
        // Loading state for accounts
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="win11-card p-4 relative">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Skeleton className="h-16 rounded" />
                  <Skeleton className="h-16 rounded" />
                </div>
                
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAccounts.length > 0 ? (
        // Accounts grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredAccounts.map((account: AccountSummary) => (
            <AccountCard
              key={account.id}
              account={account}
              onRefresh={handleRefreshAccount}
              onDelete={handleDeleteAccount}
              onViewDetails={handleViewDetails}
              isRefreshing={refreshingAccountId === account.id}
            />
          ))}
        </div>
      ) : accounts && accounts.length > 0 ? (
        // No search results
        <Card className="win11-card p-6 text-center">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Results Found</h3>
            <p className="text-neutral-500 mb-6 max-w-md mx-auto">
              No accounts match your search criteria. Try a different search term.
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Empty state
        <Card className="win11-card p-6 text-center">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Accounts Added</h3>
            <p className="text-neutral-500 mb-6 max-w-md mx-auto">
              Add a Steam account to start tracking your inventory cases and their values.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Account Details Section (Shown when account is selected) */}
      {selectedAccountId && (
        <AccountDetails 
          accountId={selectedAccountId}
          onRefresh={handleRefreshAccount}
          isRefreshing={refreshingAccountId === selectedAccountId}
          onClose={() => setSelectedAccountId(null)}
        />
      )}
    </MainLayout>
  );
}
