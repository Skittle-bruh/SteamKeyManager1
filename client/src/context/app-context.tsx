import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient"; // Импортируем для страховки
import { useToast } from "@/hooks/use-toast";

// Тип контекста приложения
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

// Создаем контекст с дефолтными значениями чтобы TypeScript не ругался на undefined
const defaultContext: AppContextType = {
  apiKey: null,
  setApiKey: () => Promise.resolve(),
  checkApiKey: () => Promise.resolve(),
  isLoading: false,
  activeSection: "dashboard",
  setActiveSection: () => {},
  refreshAllAccounts: () => Promise.resolve(),
  isRefreshingAll: false,
  selectedAccountId: null,
  setSelectedAccountId: () => {},
};

// Создаем контекст
const AppContext = createContext<AppContextType>(defaultContext);

// Компонент-провайдер контекста
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const queryClientHook = useQueryClient();
  
  // Состояния приложения
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [activeSection, setActiveSectionState] = useState("dashboard");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Обертка для setActiveSection с отладкой
  const setActiveSection = (section: string) => {
    console.log('setActiveSection called with:', section);
    console.log('Current activeSection before:', activeSection);
    setActiveSectionState(prev => {
      console.log('setActiveSectionState: prev was:', prev, 'new is:', section);
      return section;
    });
    console.log('setActiveSectionState called');
  };

  // Установка API ключа
  const setApiKey = async (key: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`API key save failed: ${response.statusText}`);
      }
      
      setApiKeyState(key);
      toast({
        title: "Успех",
        description: "API ключ успешно сохранен",
      });
      
      // Используем queryClient из хука, если доступен, иначе импортированный
      const client = queryClientHook || queryClient;
      client.invalidateQueries({ queryKey: ['/api/settings/api-key'] });
    } catch (error) {
      console.error("Ошибка сохранения API ключа:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить API ключ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка API ключа
  const checkApiKey = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/api-key", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.hasApiKey) {
          setApiKeyState("********");
        }
      }
    } catch (error) {
      console.error("Ошибка проверки API ключа:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление всех аккаунтов
  const refreshAllAccounts = async () => {
    try {
      setIsRefreshingAll(true);
      toast({
        title: "Обработка",
        description: "Начинаем обновление всех аккаунтов...",
      });
      
      const response = await fetch("/api/accounts/refresh-all", {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        // Используем queryClient из хука, если доступен, иначе импортированный
        const client = queryClientHook || queryClient;
        client.invalidateQueries({ queryKey: ['/api/accounts'] });
        client.invalidateQueries({ queryKey: ['/api/cases'] });
        client.invalidateQueries({ queryKey: ['/api/summary'] });
        
        toast({
          title: "Успех",
          description: "Все аккаунты успешно обновлены",
        });
      } else {
        throw new Error("Ошибка обновления");
      }
    } catch (error) {
      console.error("Ошибка обновления аккаунтов:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить аккаунты",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingAll(false);
    }
  };

  // Проверяем API ключ при загрузке
  useEffect(() => {
    checkApiKey();
  }, []);

  // Отладочный эффект для отслеживания изменений activeSection
  useEffect(() => {
    console.log('activeSection changed to:', activeSection);
  }, [activeSection]);

  // Собираем значение контекста
  const contextValue: AppContextType = {
    apiKey,
    setApiKey,
    checkApiKey,
    isLoading,
    activeSection,
    setActiveSection,
    refreshAllAccounts,
    isRefreshingAll,
    selectedAccountId,
    setSelectedAccountId,
  };

  console.log('Context value created with activeSection:', activeSection);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Хук для использования контекста в компонентах
export const useAppContext = () => {
  return useContext(AppContext);
};