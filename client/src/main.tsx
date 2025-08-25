// Импортируем основные зависимости
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "./context/app-context";
import "./index.css";
import App from "./App";

// Создаем корневой компонент
const Root = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

// Рендерим приложение
createRoot(document.getElementById("root") as HTMLElement).render(<Root />);
