import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Settings from "@/pages/settings";
import Logs from "@/pages/logs";
import { useAppContext } from "./context/app-context";

function Router() {
  const { activeSection } = useAppContext();

  // Render based on active section (for SPA-like navigation)
  // We're using this approach instead of wouter for navigation
  // to maintain a single-page structure for a desktop app feel
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "accounts":
        return <Accounts />;
      case "settings":
        return <Settings />;
      case "logs":
        return <Logs />;
      default:
        return <NotFound />;
    }
  };

  return renderContent();
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
