import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Search, RefreshCw, Trash2, MoreVertical, AlertCircle, Info, AlertTriangle, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Log {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  details?: any;
}

export default function Logs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Fetch logs
  const { 
    data: logs = [], 
    isLoading,
    refetch 
  } = useQuery<Log[]>({
    queryKey: ['/api/logs'],
  });
  
  // Clear logs mutation
  const clearLogs = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/logs');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      toast({
        title: "Logs Cleared",
        description: "All logs have been cleared successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear logs",
        variant: "destructive",
      });
    }
  });
  
  const handleClearLogs = async () => {
    setShowClearConfirm(false);
    await clearLogs.mutateAsync();
  };
  
  // Filter logs based on search term and level filter
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });
  
  // Function to get log level badge
  const getLogLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        );
      case 'info':
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Info
          </Badge>
        );
    }
  };
  
  // Function to export logs as JSON
  const exportLogs = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `steam_parser_logs_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Logs Exported",
        description: "Logs have been exported successfully",
      });
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast({
        title: "Error",
        description: "Failed to export logs",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout title="Logs" description="Application activity logs">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Application Logs</CardTitle>
            <CardDescription>View and manage application activity logs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowClearConfirm(true)} 
              className="text-xs text-destructive hover:text-destructive"
              disabled={logs.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportLogs} 
              className="text-xs"
              disabled={logs.length === 0}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length > 0 ? (
            // Logs list
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {filteredLogs.map(log => (
                <Card key={log.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getLogLevelBadge(log.level)}
                        <span className="text-sm font-medium">
                          {log.message}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    {log.details && (
                      <div className="mt-2 text-xs bg-neutral-50 p-2 rounded border border-neutral-200 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // No logs or no search results
            <div className="text-center py-12">
              {logs.length === 0 ? (
                <>
                  <ClipboardIcon className="mx-auto h-12 w-12 text-neutral-300" />
                  <h3 className="mt-4 text-lg font-medium text-neutral-900">No logs yet</h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    Application logs will appear here as you use the application.
                  </p>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-12 w-12 text-neutral-300" />
                  <h3 className="mt-4 text-lg font-medium text-neutral-900">No matching logs</h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    Try changing your search or filter criteria.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("");
                      setLevelFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-neutral-500 bg-neutral-50 rounded-b-lg">
          <span>Total logs: {logs.length}</span>
          <span>Filtered logs: {filteredLogs.length}</span>
        </CardFooter>
      </Card>
      
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearLogs} 
              className="bg-destructive text-destructive-foreground"
            >
              Clear All Logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

// Clipboard icon for empty state
const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);
