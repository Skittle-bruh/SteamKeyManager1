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
import { Eye, EyeOff, Save, ShieldAlert } from "lucide-react";
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
  
  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    onSuccess: (data) => {
      if (data) {
        setCurrency(data.currency || "USD");
        setRequestDelay(data.requestDelay || 2000);
        setUserAgents(Array.isArray(data.userAgents) ? data.userAgents.join('\n') : "");
      }
    }
  });
  
  // Fetch API key info
  const { data: apiKeyData } = useQuery({
    queryKey: ['/api/settings/api-key'],
  });
  
  useEffect(() => {
    if (apiKeyData?.preview) {
      setPendingApiKey(apiKeyData.preview);
    }
  }, [apiKeyData]);
  
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
      if (pendingApiKey.includes('*') && pendingApiKey === apiKeyData?.preview) {
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
    <MainLayout title="Settings" description="Configure application settings">
      <div className="grid grid-cols-1 gap-6">
        {/* API Key Settings */}
        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
            <CardDescription>
              Configure your Steam API key for accessing the Steam Web API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showApiKey ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
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
                Save API Key
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure application behavior and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
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
                  Currency used for displaying prices and values
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Request Delay</Label>
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
                  Delay between requests to Steam servers (1000-5000ms)
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
