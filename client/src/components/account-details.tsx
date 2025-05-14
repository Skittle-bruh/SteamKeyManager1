import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useCases, Case } from "@/hooks/use-cases";
import { formatDate, formatCurrency, getPlaceholderAvatar } from "@/lib/utils";
import { Loader2, RefreshCw, Download, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AccountDetailsProps {
  accountId: number;
  onRefresh: (id: number) => void;
  isRefreshing: boolean;
  onClose: () => void;
}

export function AccountDetails({ accountId, onRefresh, isRefreshing, onClose }: AccountDetailsProps) {
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { cases, isLoading: casesLoading } = useCases(accountId);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "quantity" | "price" | "total">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const account = accounts?.find(a => a.id === accountId);
  
  // Calculate summary data
  const totalCases = cases?.reduce((sum, c) => sum + c.quantity, 0) || 0;
  const totalValue = cases?.reduce((sum, c) => {
    if (c.price) {
      return sum + (c.price * c.quantity);
    }
    return sum;
  }, 0) || 0;
  const averagePrice = totalCases > 0 ? totalValue / totalCases : 0;
  
  // Filter and sort cases
  const filteredCases = cases?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.marketHashName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortField === "quantity") {
      return sortDirection === "asc" 
        ? a.quantity - b.quantity 
        : b.quantity - a.quantity;
    } else if (sortField === "price") {
      const aPrice = a.price || 0;
      const bPrice = b.price || 0;
      return sortDirection === "asc" ? aPrice - bPrice : bPrice - aPrice;
    } else { // total
      const aTotal = (a.price || 0) * a.quantity;
      const bTotal = (b.price || 0) * b.quantity;
      return sortDirection === "asc" ? aTotal - bTotal : bTotal - aTotal;
    }
  });
  
  const toggleSort = (field: "name" | "quantity" | "price" | "total") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getSortIcon = (field: "name" | "quantity" | "price" | "total") => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };
  
  // Download case data as CSV
  const downloadCsv = () => {
    if (!cases || cases.length === 0) return;
    
    // Prepare CSV header
    const csvHeader = ['Name', 'Market Name', 'Quantity', 'Unit Price', 'Total Value', 'Last Updated'].join(',');
    
    // Prepare CSV rows
    const csvRows = cases.map(c => {
      const unitPrice = c.price ? formatCurrency(c.price, 'USD') : 'N/A';
      const totalValue = c.price ? formatCurrency(c.price * c.quantity, 'USD') : 'N/A';
      return [
        `"${c.name}"`,
        `"${c.marketHashName}"`,
        c.quantity,
        unitPrice,
        totalValue,
        new Date(c.lastUpdated).toLocaleString()
      ].join(',');
    });
    
    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join('\r\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Prepare file name
    const accountName = account?.nickname || account?.steamId || 'account';
    const fileName = `${accountName}_cases_${new Date().toISOString().slice(0, 10)}.csv`;
    
    // Set up download
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // This is a full-width detailed section when an account is selected
  return (
    <Card className="win11-card p-6 mt-6">
      {accountsLoading ? (
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Skeleton className="w-10 h-10 rounded-full mr-3" />
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          
          {/* Skeleton for inventory summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          
          {/* Skeleton for table */}
          <div className="overflow-x-auto">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : account ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 overflow-hidden mr-3">
                <img
                  src={account.avatarUrl || getPlaceholderAvatar(account.nickname || account.steamId)}
                  alt="Steam avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">{account.nickname || account.steamId}</h3>
                <p className="text-sm text-neutral-500">{account.steamId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 ml-auto">
              <Button variant="ghost" onClick={onClose} size="icon">
                <X className="h-5 w-5" />
              </Button>
              <span className="text-sm text-neutral-500">Обновлено: {formatDate(account.lastUpdated)}</span>
              <Button
                onClick={() => onRefresh(accountId)}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                {isRefreshing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                Обновить
              </Button>
            </div>
          </div>
          
          {/* Inventory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-neutral-100 p-3 rounded-lg">
              <p className="text-sm text-neutral-500">Total Cases</p>
              <p className="text-xl font-semibold text-neutral-900">{totalCases}</p>
            </div>
            <div className="bg-neutral-100 p-3 rounded-lg">
              <p className="text-sm text-neutral-500">Total Value</p>
              <p className="text-xl font-semibold text-green-600">{formatCurrency(totalValue)}</p>
            </div>
            <div className="bg-neutral-100 p-3 rounded-lg">
              <p className="text-sm text-neutral-500">Average Price</p>
              <p className="text-xl font-semibold text-blue-600">{formatCurrency(averagePrice)}</p>
            </div>
          </div>
          
          {/* Inventory Filter Controls */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8 w-[200px]"
                />
                <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              </div>
              
              <Select
                value={`${sortField}_${sortDirection}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split('_');
                  setSortField(field as any);
                  setSortDirection(direction as "asc" | "desc");
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Sort by: Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Sort by: Name (Z-A)</SelectItem>
                  <SelectItem value="price_asc">Sort by: Price (Low to High)</SelectItem>
                  <SelectItem value="price_desc">Sort by: Price (High to Low)</SelectItem>
                  <SelectItem value="quantity_asc">Sort by: Quantity (Low to High)</SelectItem>
                  <SelectItem value="quantity_desc">Sort by: Quantity (High to Low)</SelectItem>
                  <SelectItem value="total_asc">Sort by: Total Value (Low to High)</SelectItem>
                  <SelectItem value="total_desc">Sort by: Total Value (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCsv}
                disabled={!cases || cases.length === 0}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Cases Table */}
          {casesLoading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Case Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Unit Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Value</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-10 rounded" />
                          <div className="ml-4">
                            <Skeleton className="h-5 w-32 mb-1" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-12" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-20" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-32" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : sortedCases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1" 
                        onClick={() => toggleSort('name')}
                      >
                        <span>Case Name</span>
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1" 
                        onClick={() => toggleSort('quantity')}
                      >
                        <span>Quantity</span>
                        {getSortIcon('quantity')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1" 
                        onClick={() => toggleSort('price')}
                      >
                        <span>Unit Price</span>
                        {getSortIcon('price')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1" 
                        onClick={() => toggleSort('total')}
                      >
                        <span>Total Value</span>
                        {getSortIcon('total')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {sortedCases.map((caseItem: Case) => (
                    <tr key={caseItem.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden">
                            <img 
                              src={caseItem.imageUrl || "https://steamcommunity-a.akamaihd.net/economy/image/placeholder-case.jpg"}
                              alt={caseItem.name} 
                              className="h-10 w-10 object-cover" 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900">{caseItem.name}</div>
                            <div className="text-xs text-neutral-500">{caseItem.marketHashName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">{caseItem.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">
                          {caseItem.price ? formatCurrency(caseItem.price) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">
                          {caseItem.price ? formatCurrency(caseItem.price * caseItem.quantity) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {formatDate(caseItem.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : cases && cases.length > 0 ? (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-2 text-lg font-medium text-neutral-800">No cases match your search</h3>
              <p className="text-neutral-500">Try a different search term</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-2 text-lg font-medium text-neutral-800">No Cases Found</h3>
              <p className="text-neutral-500">This account doesn't have any cases in its inventory or they haven't been loaded yet</p>
              <Button className="mt-4" onClick={() => onRefresh(accountId)}>
                Refresh Inventory
              </Button>
            </div>
          )}
        </>
      ) : (
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-xl font-semibold text-neutral-700 mb-2">Account Not Found</h3>
          <p className="text-neutral-500 mb-6">The selected account could not be found.</p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
