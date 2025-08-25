import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCases, Case } from "@/hooks/use-cases";
import { useAccounts } from "@/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import { Search, RefreshCw, Loader2, X, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CasesModalProps {
  accountId: number;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: (id: number) => void;
  isRefreshing: boolean;
}

interface GroupedCase {
  name: string;
  marketHashName: string;
  imageUrl?: string;
  quantity: number;
  unitPrice?: number;
  totalValue: number;
  items: Case[];
}

export function CasesModal({ accountId, isOpen, onClose, onRefresh, isRefreshing }: CasesModalProps) {
  const { accounts } = useAccounts();
  const { cases, isLoading: casesLoading } = useCases(accountId);
  const [searchTerm, setSearchTerm] = useState("");

  const account = accounts?.find(a => a.id === accountId);

  // Group cases by market hash name
  const groupedCases: GroupedCase[] = React.useMemo(() => {
    if (!cases) return [];

    const groups = new Map<string, GroupedCase>();
    
    cases.forEach(caseItem => {
      const key = caseItem.marketHashName;
      
      if (groups.has(key)) {
        const existing = groups.get(key)!;
        existing.quantity += caseItem.quantity;
        existing.totalValue += (caseItem.price || 0) * caseItem.quantity;
        existing.items.push(caseItem);
      } else {
        groups.set(key, {
          name: caseItem.name,
          marketHashName: caseItem.marketHashName,
          imageUrl: caseItem.imageUrl,
          quantity: caseItem.quantity,
          unitPrice: caseItem.price || undefined,
          totalValue: (caseItem.price || 0) * caseItem.quantity,
          items: [caseItem]
        });
      }
    });

    return Array.from(groups.values());
  }, [cases]);

  // Filter grouped cases by search term
  const filteredCases = groupedCases.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.marketHashName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total summary
  const totalCases = groupedCases.reduce((sum, group) => sum + group.quantity, 0);
  const totalValue = groupedCases.reduce((sum, group) => sum + group.totalValue, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center overflow-hidden">
                {account?.avatarUrl && (
                  <img
                    src={account.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Кейсы - {account?.nickname || account?.steamId}
                </h2>
                <p className="text-sm text-neutral-500">
                  {totalCases} кейсов • {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => onRefresh(accountId)}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Обновить
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 mb-4">
          <div className="relative">
            <Input
              placeholder="Поиск кейсов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
            <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {casesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-16 h-16 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-40 mb-2" />
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map((group, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-neutral-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                      {group.imageUrl ? (
                        <img
                          src={group.imageUrl}
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-neutral-900 mb-1 truncate">
                        {group.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mb-2 line-clamp-2">
                        {group.marketHashName}
                      </p>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-600">Количество:</span>
                          <span className="font-medium">{group.quantity}</span>
                        </div>
                        
                        {group.unitPrice && (
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-600">За штуку:</span>
                            <span className="font-medium">{formatCurrency(group.unitPrice)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-xs border-t pt-1">
                          <span className="text-neutral-600">Общая цена:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(group.totalValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : cases && cases.length > 0 ? (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-2 text-lg font-medium text-neutral-800">Ничего не найдено</h3>
              <p className="text-neutral-500">Попробуйте другой поисковый запрос</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                Очистить поиск
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-2 text-lg font-medium text-neutral-800">Кейсы не найдены</h3>
              <p className="text-neutral-500">
                В инвентаре этого аккаунта нет кейсов или они еще не загружены
              </p>
              <Button className="mt-4" onClick={() => onRefresh(accountId)}>
                Обновить инвентарь
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}