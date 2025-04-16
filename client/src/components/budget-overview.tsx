import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Budget } from "@shared/schema";
import { formatMoney, calculateBudgetPercentage } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Progress } from "@/components/ui/progress";

interface BudgetOverviewProps {
  month: number;
  year: number;
  totalExpenses: number;
}

export function BudgetOverview({ month, year, totalExpenses }: BudgetOverviewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch the budget for the current month
  const { data: budget, isLoading } = useQuery<Budget>({
    queryKey: [`/api/budgets/current`],
    enabled: !!user,
  });

  // Budget form validation schema
  const formSchema = z.object({
    amount: z.string().min(1, t("validation.amount_required")).refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      t("validation.amount_positive")
    ),
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: budget ? String(budget.amount) : "",
    },
  });

  // Update form when budget changes
  useEffect(() => {
    if (budget) {
      form.setValue("amount", String(budget.amount));
    }
  }, [budget, form]);

  // Budget mutation
  const budgetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Converte o valor string para um número decimal com no máximo 2 casas decimais
      const amountValue = parseFloat(parseFloat(data.amount).toFixed(2));
      
      const payload = {
        amount: amountValue,
        month,
        year,
        userId: user!.id,
      };

      if (budget) {
        await apiRequest("PUT", `/api/budgets/${budget.id}`, payload);
      } else {
        await apiRequest("POST", "/api/budgets", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      setIsDialogOpen(false);
      toast({
        title: t("toast.budget_updated"),
        description: t("toast.budget_updated_description"),
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
    budgetMutation.mutate(values);
  };

  // Calculate the budget values
  const budgetAmount = budget ? Number(budget.amount) : 0;
  const remainingAmount = Math.max(budgetAmount - totalExpenses, 0);
  const savedAmount = budget ? (budgetAmount > totalExpenses ? budgetAmount - totalExpenses : 0) : 0;
  const usedPercentage = calculateBudgetPercentage(totalExpenses, budgetAmount);

  if (isLoading) {
    return (
      <div className="mb-6 bg-white dark:bg-neutral-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-neutral-800 dark:text-white">
            {t("budget.overview")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="text-secondary dark:text-accent"
          >
            <Edit className="h-4 w-4 mr-1" />
            {t("common.edit")}
          </Button>
        </div>
        <div className="flex justify-center py-8">
          <p className="text-neutral-500 dark:text-neutral-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 bg-white dark:bg-neutral-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-neutral-800 dark:text-white">
            {t("budget.overview")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="text-secondary dark:text-accent"
          >
            <Edit className="h-4 w-4 mr-1" />
            {t("common.edit")}
          </Button>
        </div>

        {!budget ? (
          <div className="text-center py-4">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">{t("budget.setup_budget")}</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="secondary">
              {t("budget.add_budget")}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t("budget.income")}</p>
                <p className="text-xl font-semibold text-neutral-800 dark:text-white">
                  {formatMoney(budgetAmount)}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t("budget.expenses")}</p>
                <p className="text-xl font-semibold text-red-500">
                  {formatMoney(totalExpenses)}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t("budget.remaining")}</p>
                <p className="text-xl font-semibold text-green-500">
                  {formatMoney(remainingAmount)}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t("budget.saved")}</p>
                <p className="text-xl font-semibold text-secondary dark:text-accent">
                  {formatMoney(savedAmount)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600 dark:text-neutral-400">{t("budget.budget_used")}</span>
                <span className="text-neutral-800 dark:text-white font-medium">{usedPercentage}%</span>
              </div>
              <Progress value={usedPercentage} className="h-2.5" />
            </div>
          </>
        )}
      </div>

      {/* Budget Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {budget ? t("budget.edit_budget") : t("budget.add_budget")}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("budget.income")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t("budget.income_placeholder")}
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
                  disabled={budgetMutation.isPending}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={budgetMutation.isPending}>
                  {budgetMutation.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
