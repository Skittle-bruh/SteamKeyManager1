import React from "react";
import { Sidebar } from "./sidebar";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Key } from "lucide-react";
import { ApiKeyModal } from "@/components/modals/api-key-modal";
import { useState } from "react";
import { AddAccountModal } from "@/components/modals/add-account-modal";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showAddAccount?: boolean;
}

export function MainLayout({ children, title, description, showAddAccount = false }: MainLayoutProps) {
  const { refreshAllAccounts, isRefreshingAll, activeSection } = useAppContext();
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);

  const handleRefreshAll = () => {
    refreshAllAccounts();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-100">
        <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            {description && <p className="text-sm text-neutral-500">{description}</p>}
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setApiKeyModalOpen(true)}
            >
              <Key className="h-5 w-5" />
              API Ключ
            </Button>
            
            {activeSection === "dashboard" && (
              <Button
                className="flex items-center gap-2"
                onClick={handleRefreshAll}
                disabled={isRefreshingAll}
              >
                {isRefreshingAll ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                Обновить все
              </Button>
            )}

            {showAddAccount && (
              <Button
                className="flex items-center gap-2"
                onClick={() => setAddAccountModalOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Добавить аккаунт
              </Button>
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <ApiKeyModal open={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
      <AddAccountModal open={addAccountModalOpen} onClose={() => setAddAccountModalOpen(false)} />
    </div>
  );
}
