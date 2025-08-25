import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import { Eye, EyeOff, Save, ShieldAlert, Moon, Sun } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { apiKey, setApiKey } = useAppContext();
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [pendingApiKey, setPendingApiKey] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [requestDelay, setRequestDelay] = useState(2000);
  const [userAgents, setUserAgents] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings']
  });
  
  // Update form values when settings data changes
  React.useEffect(() => {
    if (settings && typeof settings === 'object') {
      const settingsData = settings as any;
      setCurrency(settingsData.currency || "USD");
      setRequestDelay(settingsData.requestDelay || 2000);
      setUserAgents(Array.isArray(settingsData.userAgents) ? settingsData.userAgents.join('\n') : "");
    }
  }, [settings]);
  
  // Fetch API key info
  const { data: apiKeyData } = useQuery<{ hasApiKey: boolean; preview: string }>({
    queryKey: ['/api/settings/api-key']
  });
  
  useEffect(() => {
    if (apiKeyData?.preview) {
      setPendingApiKey(apiKeyData.preview);
    }
  }, [apiKeyData]);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(prefersDark);
    applyTheme(prefersDark);
  }, []);

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
    applyTheme(checked);
    
    toast({
      title: "Тема изменена",
      description: `Переключено на ${checked ? 'темную' : 'светлую'} тему`,
    });
  };
  
  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  });
  
  const handleSaveApiKey = async () => {
    try {
      // If it's a masked value and hasn't changed, don't save
      if (pendingApiKey.includes('*') && apiKeyData && pendingApiKey === apiKeyData.preview) {
        toast({
          title: "No Changes",
          description: "API key unchanged",
        });
        return;
      }
      
      await setApiKey(pendingApiKey);
    } catch (error) {
      console.error("Error saving API key:", error);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      // Parse user agents into array
      const userAgentsArray = userAgents.split('\n')
        .map(ua => ua.trim())
        .filter(ua => ua.length > 0);
      
      if (userAgentsArray.length === 0) {
        toast({
          title: "Error",
          description: "At least one user agent is required",
          variant: "destructive",
        });
        return;
      }
      
      await saveSettings.mutateAsync({
        currency,
        requestDelay,
        userAgents: userAgentsArray
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };
  
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <MainLayout title="Настройки" description="Управление настройками приложения">
      <div className="grid grid-cols-1 gap-6">
        {/* Theme Settings */}
        <Card className="win11-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Внешний вид
            </CardTitle>
            <CardDescription>
              Настройки темы оформления
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Темная тема</Label>
                <p className="text-sm text-muted-foreground">
                  Переключение между светлой и темной темой
                </p>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleThemeChange}
                aria-label="Toggle dark mode"
              />
            </div>
          </CardContent>
        </Card>
        {/* API Key Settings */}
        <Card className="win11-card">
          <CardHeader>
            <CardTitle>Steam API Ключ</CardTitle>
            <CardDescription>
              Настройка ключа Steam API для доступа к данным Steam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                Your API key is stored locally and is only used to access the Steam Web API.
                It is never sent to any third-party servers.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">Steam Web API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={pendingApiKey}
                  onChange={(e) => setPendingApiKey(e.target.value)}
                  placeholder="Enter your Steam API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={toggleApiKeyVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                >
                  {showApiKey ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Получите ваш API ключ на{" "}
                <a
                  href="https://steamcommunity.com/dev/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Steam Developer Portal
                </a>
              </p>
            </div>
            
            <div className="mt-4">
              <Button onClick={handleSaveApiKey} disabled={saveSettings.isPending}>
                Сохранить API ключ
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* General Settings */}
        <Card className="win11-card">
          <CardHeader>
            <CardTitle>Общие настройки</CardTitle>
            <CardDescription>
              Настройки поведения приложения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select 
                  value={currency} 
                  onValueChange={setCurrency}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                    <SelectItem value="RUB">Russian Ruble (RUB)</SelectItem>
                    <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                    <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                    <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Валюта для отображения цен и стоимости
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Задержка запросов</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[requestDelay]}
                    min={1000}
                    max={5000}
                    step={100}
                    onValueChange={(values) => setRequestDelay(values[0])}
                    className="flex-1"
                  />
                  <span className="w-16 text-right text-sm">{requestDelay}ms</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Задержка между запросами к серверам Steam (1000-5000мс)
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="userAgents">User Agents</Label>
                <Textarea
                  id="userAgents"
                  value={userAgents}
                  onChange={(e) => setUserAgents(e.target.value)}
                  placeholder="Enter one user agent per line"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  List of user agents to rotate between requests (one per line)
                </p>
              </div>
              
              <Button 
                onClick={handleSaveSettings} 
                disabled={saveSettings.isPending} 
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
