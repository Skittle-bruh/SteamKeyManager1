import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useAccounts, AccountSummary } from "@/hooks/use-accounts";
import { useCasesSummary } from "@/hooks/use-cases";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AccountCard } from "@/components/account-card";
import { CasesModal } from "@/components/cases-modal";
import { useAppContext } from "@/context/app-context";
import { Users, Briefcase, DollarSign, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { accounts, useAccountsWithSummary, refreshAccount, deleteAccount, isLoading: accountsLoading } = useAccounts();
  const { summary, isLoading: summaryLoading } = useCasesSummary();
  const { selectedAccountId, setSelectedAccountId } = useAppContext();
  const [refreshingAccountId, setRefreshingAccountId] = useState<number | null>(null);

  const accountsWithSummary = useAccountsWithSummary();

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

  const [showCasesModal, setShowCasesModal] = useState(false);

  const handleViewDetails = (id: number) => {
    console.log('Opening cases modal for account:', id);
    setSelectedAccountId(id);
    setShowCasesModal(true);
  };

  const isLoading = accountsLoading || summaryLoading;

  return (
    <MainLayout 
      title="Dashboard" 
      description="Overview of all your Steam accounts"
      showAddAccount
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Accounts */}
        <Card className="win11-card p-4">
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-light bg-opacity-20 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">Total Accounts</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {accounts?.length || 0}
                  </h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cases */}
        <Card className="win11-card p-4">
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">Total Cases</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {summary?.totalCases || 0}
                  </h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card className="win11-card p-4">
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">Total Value</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {summary?.formattedValue || "$0.00"}
                  </h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Update */}
        <Card className="win11-card p-4">
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-500">Last Update</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {formatDate(summary?.lastUpdated || null)}
                  </h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Management Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Steam Accounts</h3>
      </div>

      {accountsLoading ? (
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
      ) : accountsWithSummary.length > 0 ? (
        // Accounts grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {accountsWithSummary.map((account: AccountSummary) => (
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

      {/* Cases Modal */}
      {selectedAccountId && (
        <CasesModal
          accountId={selectedAccountId}
          isOpen={showCasesModal}
          onClose={() => {
            setShowCasesModal(false);
            setSelectedAccountId(null);
          }}
          onRefresh={handleRefreshAccount}
          isRefreshing={refreshingAccountId === selectedAccountId}
        />
      )}
    </MainLayout>
  );
}
