import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";
import { AccountSummary } from "@/hooks/use-accounts";
import { formatDate, getPlaceholderAvatar } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
import { useAppContext } from "@/context/app-context";

interface AccountCardProps {
  account: AccountSummary;
  onRefresh: (id: number) => void;
  onDelete: (id: number) => void;
  onViewDetails: (id: number) => void;
  isRefreshing: boolean;
}

export function AccountCard({
  account,
  onRefresh,
  onDelete,
  onViewDetails,
  isRefreshing,
}: AccountCardProps) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRefresh(account.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(account.id);
    setShowDeleteConfirm(false);
  };

  const handleViewDetails = () => {
    onViewDetails(account.id);
  };

  return (
    <>
      <Card className="win11-card p-4 relative hover:shadow-md transition-all">
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="p-1 text-neutral-500 hover:text-primary transition-colors"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="p-1 text-neutral-500 hover:text-destructive transition-colors"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-0">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 overflow-hidden">
              <img
                src={account.avatarUrl || getPlaceholderAvatar(account.nickname || account.steamId)}
                alt="Steam avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="ml-3">
              <h4 className="font-semibold text-neutral-900">
                {account.nickname || account.steamId}
              </h4>
              <p className="text-sm text-neutral-500">{account.steamId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-neutral-100 p-2 rounded">
              <p className="text-xs text-neutral-500">Количество кейсов</p>
              <p className="font-semibold text-neutral-800">{account.casesCount}</p>
            </div>
            <div className="bg-neutral-100 p-2 rounded">
              <p className="text-xs text-neutral-500">Общая стоимость</p>
              <p className="font-semibold text-green-600">{account.formattedValue}</p>
            </div>
          </div>

          <div className="flex justify-between text-xs text-neutral-500">
            <span>Обновлено: {formatDate(account.lastUpdated)}</span>
            <Button
              variant="link"
              size="sm"
              className="text-primary hover:underline p-0 h-auto"
              onClick={handleViewDetails}
            >
              Подробнее
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это удалит аккаунт "{account.nickname || account.steamId}" и все его
              связанные данные о кейсах. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
