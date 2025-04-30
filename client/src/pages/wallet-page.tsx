import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Wallet, InsertWallet } from "@shared/schema";
import { formatMoney } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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

export default function WalletPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);

  // Fetch wallets
  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
    enabled: !!user,
  });

  // Calculate total balance
  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.balance),
    0
  );

  // Wallet form validation schema
  const formSchema = z.object({
    name: z.string().min(1, t("validation.name_required")),
    balance: z.string().refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      t("validation.amount_positive")
    ),
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      balance: "0",
    },
  });

  // Reset form when editing wallet changes
  useState(() => {
    if (editingWallet) {
      form.reset({
        name: editingWallet.name,
        balance: String(editingWallet.balance),
      });
    } else {
      form.reset({
        name: "",
        balance: "0",
      });
    }
  });

  // Wallet mutation
  const walletMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload: InsertWallet = {
        name: data.name,
        balance: Number(data.balance),
        userId: user!.id,
      };

      if (editingWallet) {
        await apiRequest("PUT", `/api/wallets/${editingWallet.id}`, payload);
      } else {
        await apiRequest("POST", "/api/wallets", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setIsDialogOpen(false);
      setEditingWallet(null);
      form.reset();
      toast({
        title: editingWallet
          ? t("toast.wallet_updated")
          : t("toast.wallet_added"),
        description: editingWallet
          ? t("toast.wallet_updated_description")
          : t("toast.wallet_added_description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete wallet mutation
  const deleteWalletMutation = useMutation({
    mutationFn: async (walletId: number) => {
      await apiRequest("DELETE", `/api/wallets/${walletId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setWalletToDelete(null);
      toast({
        title: t("toast.wallet_deleted"),
        description: t("toast.wallet_deleted_description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    walletMutation.mutate(values);
  };

  // Handle add wallet click
  const handleAddWallet = () => {
    setEditingWallet(null);
    form.reset({
      name: "",
      balance: "0",
    });
    setIsDialogOpen(true);
  };

  // Handle edit wallet click
  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    form.reset({
      name: wallet.name,
      balance: String(wallet.balance),
    });
    setIsDialogOpen(true);
  };

  // Handle delete wallet click
  const handleDeleteWallet = (wallet: Wallet) => {
    setWalletToDelete(wallet);
  };

  // Confirm delete wallet
  const confirmDeleteWallet = () => {
    if (walletToDelete) {
      deleteWalletMutation.mutate(walletToDelete.id);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-16 md:pb-0 overflow-y-auto custom-scrollbar">
      <Header title={t("wallet.wallet")} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Total Balance Card */}
        <Card className="mb-6 bg-secondary dark:bg-secondary">
          <CardHeader>
            <CardTitle className="text-white">{t("wallet.total")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {formatMoney(totalBalance)}
            </p>
          </CardContent>
        </Card>

        {/* Add Wallet Button */}
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleAddWallet}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>{t("wallet.add_wallet")}</span>
          </Button>
        </div>

        {/* Wallets List */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-neutral-500 dark:text-neutral-400">{t("common.loading")}</p>
          </div>
        ) : wallets.length === 0 ? (
          <Card className="bg-white dark:bg-neutral-800 shadow p-8 text-center">
            <CardContent className="pt-6">
              <p className="text-neutral-500 dark:text-neutral-400">
                {t("wallet.no_wallets")}
              </p>
              <Button 
                onClick={handleAddWallet} 
                className="mt-4"
              >
                {t("wallet.add_wallet")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wallets.map((wallet) => (
              <Card key={wallet.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl">{wallet.name}</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditWallet(wallet)}
                      title={t("common.edit")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWallet(wallet)}
                      title={t("common.delete")}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {formatMoney(Number(wallet.balance))}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <MobileNavigation />

      {/* Wallet Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingWallet ? t("wallet.edit_wallet") : t("wallet.add_wallet")}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("wallet.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("wallet.name_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("wallet.balance")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t("wallet.balance_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={walletMutation.isPending}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={walletMutation.isPending}>
                  {walletMutation.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!walletToDelete}
        onOpenChange={(open) => !open && setWalletToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("wallet.delete_wallet")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("wallet.delete_wallet_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWallet}
              className="bg-red-500 hover:bg-red-600"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
