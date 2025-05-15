import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Saving, InsertSaving } from "@shared/schema";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

export default function SavingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [savingToDelete, setSavingToDelete] = useState<Saving | null>(null);

  // Fetch savings
  const { data: savings = [], isLoading } = useQuery<Saving[]>({
    queryKey: ["/api/savings"],
    enabled: !!user,
  });

  // Calculate total saved amount
  const totalSaved = savings.reduce(
    (sum, saving) => sum + Number(saving.currentAmount),
    0
  );

  // Saving form validation schema
  const formSchema = z.object({
    name: z.string().min(1, t("validation.name_required")),
    targetAmount: z.string().min(1, t("validation.target_required")).refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      t("validation.amount_positive")
    ),
    currentAmount: z.string().refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      t("validation.amount_positive")
    ),
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      currentAmount: "0",
    },
  });

  // Reset form when editing saving changes
  useState(() => {
    if (editingSaving) {
      form.reset({
        name: editingSaving.name,
        targetAmount: String(editingSaving.targetAmount),
        currentAmount: String(editingSaving.currentAmount),
      });
    } else {
      form.reset({
        name: "",
        targetAmount: "",
        currentAmount: "0",
      });
    }
  });

  // Saving mutation
  const savingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload: InsertSaving = {
        name: data.name,
        targetAmount: Number(data.targetAmount),
        currentAmount: Number(data.currentAmount),
        userId: user!.id,
      };

      // Armazenar para verificação de metas alcançadas
      const currentAmount = Number(data.currentAmount);
      const targetAmount = Number(data.targetAmount);
      const savingName = data.name;
      const isUpdating = !!editingSaving;
      const previousValue = isUpdating ? Number(editingSaving.currentAmount) : 0;

      if (editingSaving) {
        await apiRequest("PUT", `/api/savings/${editingSaving.id}`, payload);
      } else {
        await apiRequest("POST", "/api/savings", payload);
      }

      // Retornar os valores para usar no onSuccess
      return {
        savingName,
        currentAmount,
        targetAmount,
        isUpdating,
        previousValue
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings"] });
      setIsDialogOpen(false);
      setEditingSaving(null);
      form.reset();
      
      // Mostrar toast de atualização/criação
      toast({
        title: editingSaving
          ? t("toast.saving_updated")
          : t("toast.saving_added"),
        description: editingSaving
          ? t("toast.saving_updated_description")
          : t("toast.saving_added_description"),
      });

      // Verificar se a meta foi atingida e mostrar notificação
      const { currentAmount, targetAmount, savingName, isUpdating, previousValue } = result;
      
      // Só verificar se for uma atualização (não uma nova meta) e o valor aumentou
      if (isUpdating && currentAmount > previousValue) {
        // Meta atingida
        if (currentAmount >= targetAmount) {
          toast({
            title: t("notifications.saving_goal_reached_title"),
            description: t("notifications.saving_goal_reached_body", { 
              name: savingName,
              amount: targetAmount.toFixed(2)
            }),
            variant: "default"
          });
        }
        // Próximo de atingir a meta (90%)
        else if (currentAmount >= targetAmount * 0.9 && previousValue < targetAmount * 0.9) {
          toast({
            title: t("notifications.saving_goal_near_title"),
            description: t("notifications.saving_goal_near_body", { 
              name: savingName,
              percent: Math.round((currentAmount / targetAmount) * 100)
            }),
            variant: "default"
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete saving mutation
  const deleteSavingMutation = useMutation({
    mutationFn: async (savingId: number) => {
      await apiRequest("DELETE", `/api/savings/${savingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings"] });
      setSavingToDelete(null);
      toast({
        title: t("toast.saving_deleted"),
        description: t("toast.saving_deleted_description"),
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
    savingMutation.mutate(values);
  };

  // Handle add saving click
  const handleAddSaving = () => {
    setEditingSaving(null);
    form.reset({
      name: "",
      targetAmount: "",
      currentAmount: "0",
    });
    setIsDialogOpen(true);
  };

  // Handle edit saving click
  const handleEditSaving = (saving: Saving) => {
    setEditingSaving(saving);
    form.reset({
      name: saving.name,
      targetAmount: String(saving.targetAmount),
      currentAmount: String(saving.currentAmount),
    });
    setIsDialogOpen(true);
  };

  // Handle delete saving click
  const handleDeleteSaving = (saving: Saving) => {
    setSavingToDelete(saving);
  };

  // Confirm delete saving
  const confirmDeleteSaving = () => {
    if (savingToDelete) {
      deleteSavingMutation.mutate(savingToDelete.id);
    }
  };

  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-24 md:pb-0 overflow-y-auto custom-scrollbar">
      <Header title={t("saving.savings")} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Total Saved Card */}
        <Card className="mb-6 bg-secondary dark:bg-secondary">
          <CardHeader>
            <CardTitle className="text-white">{t("saving.total")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {formatMoney(totalSaved)}
            </p>
          </CardContent>
        </Card>

        {/* Add Saving Button */}
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleAddSaving}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>{t("saving.add_saving")}</span>
          </Button>
        </div>

        {/* Savings List */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-neutral-500 dark:text-neutral-400">{t("common.loading")}</p>
          </div>
        ) : savings.length === 0 ? (
          <Card className="bg-white dark:bg-neutral-800 shadow p-8 text-center">
            <CardContent className="pt-6">
              <p className="text-neutral-500 dark:text-neutral-400">
                {t("saving.no_savings")}
              </p>
              <Button 
                onClick={handleAddSaving} 
                className="mt-4"
              >
                {t("saving.add_saving")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savings.map((saving) => {
              const progress = calculateProgress(
                Number(saving.currentAmount),
                Number(saving.targetAmount)
              );
              
              return (
                <Card key={saving.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-xl">{saving.name}</CardTitle>
                      <CardDescription>
                        {t("saving.target")}: {formatMoney(Number(saving.targetAmount))}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSaving(saving)}
                        title={t("common.edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSaving(saving)}
                        title={t("common.delete")}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatMoney(Number(saving.currentAmount))}
                        </span>
                        <span className="text-sm font-medium">
                          {progress}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <MobileNavigation />

      {/* Saving Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSaving ? t("saving.edit_saving") : t("saving.add_saving")}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("saving.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("saving.name_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("saving.target_amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("saving.current_amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
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
                  disabled={savingMutation.isPending}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={savingMutation.isPending}>
                  {savingMutation.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!savingToDelete}
        onOpenChange={(open) => !open && setSavingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("saving.delete_saving")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("saving.delete_saving_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSaving}
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
