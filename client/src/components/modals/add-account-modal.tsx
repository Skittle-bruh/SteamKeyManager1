import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/hooks/use-accounts";
import { cleanSteamIdentifier } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddAccountModal({ open, onClose }: AddAccountModalProps) {
  const { toast } = useToast();
  const { addAccount, resolveSteamId } = useAccounts();
  
  const [accountType, setAccountType] = useState<"steamid" | "customurl">("steamid");
  const [identifier, setIdentifier] = useState("");
  const [nickname, setNickname] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const handleSubmit = async () => {
    try {
      if (!identifier.trim()) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите Steam ID или пользовательский URL",
          variant: "destructive",
        });
        return;
      }

      setIsResolving(true);
      
      // Clean the identifier
      const cleanedIdentifier = cleanSteamIdentifier(identifier);
      
      // Resolve Steam ID if needed
      let steamId = cleanedIdentifier;
      
      if (accountType === "customurl" || !cleanedIdentifier.startsWith("STEAM_")) {
        const result = await resolveSteamId.mutateAsync(cleanedIdentifier);
        steamId = result.steamId;
        
        // Set nickname from profile if not specified
        if (!nickname.trim() && result.profileInfo?.nickname) {
          setNickname(result.profileInfo.nickname);
        }
      }
      
      // Add the account
      await addAccount.mutateAsync({
        steamId,
        nickname: nickname.trim() || undefined,
      });
      
      // Close the modal and reset form
      handleClose();
    } catch (error) {
      console.error("Error adding account:", error);
      toast({
        title: "Ошибка",
        description: (error as Error).message || "Не удалось добавить аккаунт",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setAccountType("steamid");
    setIdentifier("");
    setNickname("");
    // Close modal
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить аккаунт Steam</DialogTitle>
          <DialogDescription>
            Введите ваш Steam ID или пользовательский URL для добавления аккаунта для отслеживания
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Тип идентификатора аккаунта</Label>
            <RadioGroup
              value={accountType}
              onValueChange={(val) => setAccountType(val as "steamid" | "customurl")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="steamid" id="steamid" />
                <Label htmlFor="steamid">Steam ID</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customurl" id="customurl" />
                <Label htmlFor="customurl">Пользовательский URL</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">Steam ID / Пользовательский URL</Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                accountType === "steamid"
                  ? "STEAM_0:1:12345678"
                  : "https://steamcommunity.com/id/вашеимя"
              }
            />
            <p className="text-xs text-muted-foreground">
              {accountType === "steamid"
                ? "Пример: STEAM_0:1:12345678"
                : "Пример: https://steamcommunity.com/id/вашеимя или просто 'вашеимя'"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Никнейм (Опционально)</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Введите никнейм для этого аккаунта"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isResolving || addAccount.isPending}>
            {(isResolving || addAccount.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Добавить аккаунт
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
