import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Footer } from "@/components/footer";
import { Budget, Expense, Category } from "@shared/schema";
import { formatMoney } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MonthSelector } from "@/components/month-selector";
import { Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { ExpensesList } from "@/components/expenses-list";
import { ExpenseChart } from "@/components/expense-chart";

export default function FinancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);

  // Get month and year from selected date
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  // Fetch budget for current month/year
  const { data: currentBudget } = useQuery<Budget>({
    queryKey: ["/api/budgets/current"],
    enabled: !!user,
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Filter expenses for the selected month
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year
    );
  });

  // Calculate total expenses for the month
  const totalMonthlyExpenses = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  // Balance form validation schema
  const balanceFormSchema = z.object({
    amount: z.string().refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      t("validation.amount_positive")
    ),
  });

  // Initialize the balance form
  const balanceForm = useForm<z.infer<typeof balanceFormSchema>>({
    resolver: zodResolver(balanceFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  // Add balance mutation
  const addBalanceMutation = useMutation({
    mutationFn: async (data: { amount: string }) => {
      const newAmount = currentBudget 
        ? Number(currentBudget.amount) + Number(data.amount)
        : Number(data.amount);
      
      if (currentBudget) {
        return await apiRequest("PUT", `/api/budgets/${currentBudget.id}`, {
          amount: newAmount,
          month,
          year,
          userId: user!.id,
        });
      } else {
        return await apiRequest("POST", "/api/budgets", {
          amount: newAmount,
          month,
          year,
          userId: user!.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      setIsAddBalanceOpen(false);
      balanceForm.reset();
      toast({
        title: t("finance.balance_added"),
        description: t("finance.balance_added_description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("finance.balance_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBalanceSubmit = (data: z.infer<typeof balanceFormSchema>) => {
    addBalanceMutation.mutate(data);
  };

  const handleEditExpense = (expense: any) => {
    setEditExpense(expense);
    setIsAddExpenseOpen(true);
  };

  const handleAddExpense = () => {
    setEditExpense(null);
    setIsAddExpenseOpen(true);
  };

  const remainingBalance = (currentBudget?.amount ? Number(currentBudget.amount) : 0) - totalMonthlyExpenses;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-24 md:pb-0 overflow-y-auto custom-scrollbar">
      <Header title={t("navigation.finance")} />
      
      {/* Month Selector */}
      <div className="bg-white dark:bg-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <MonthSelector selected={selectedDate} onSelect={setSelectedDate} />
            <Button onClick={handleAddExpense} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t("expense.add_expense")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Saldo Total Unificado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("finance.total_balance")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoney(currentBudget?.amount ? Number(currentBudget.amount) : 0)}</div>
              <Button
                onClick={() => setIsAddBalanceOpen(true)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("finance.add_balance")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("expense.month_expenses")}</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatMoney(totalMonthlyExpenses)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("finance.remaining_balance")}</CardTitle>
              <TrendingUp className={`h-4 w-4 ${remainingBalance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(remainingBalance)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("expense.expense_chart")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseChart expenses={monthlyExpenses} categories={categories} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("expense.recent_expenses")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensesList 
                expenses={monthlyExpenses.slice(0, 5)} 
                categories={categories}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Balance Dialog */}
      <Dialog open={isAddBalanceOpen} onOpenChange={setIsAddBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("finance.add_balance")}</DialogTitle>
          </DialogHeader>
          <Form {...balanceForm}>
            <form onSubmit={balanceForm.handleSubmit(handleBalanceSubmit)} className="space-y-4">
              <FormField
                control={balanceForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("finance.amount_to_add")}</FormLabel>
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
                  onClick={() => setIsAddBalanceOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={addBalanceMutation.isPending}>
                  {addBalanceMutation.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Expense Dialog */}
      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        editExpense={editExpense}
      />

      <MobileNavigation />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}