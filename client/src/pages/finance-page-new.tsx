import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Wallet, InsertWallet, Budget, Expense, Category } from "@shared/schema";
import { formatMoney, calculateBudgetPercentage } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MonthSelector } from "@/components/month-selector";
import { Plus, Edit, Trash, LineChart, PlusCircle, BarChart3 } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { ExpensesList } from "@/components/expenses-list";
import { ExpenseChart } from "@/components/expense-chart";
import { TranslatedText } from "@/components/translated-text";

export default function FinancePage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  
  // Wallet state
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  
  // Budget state
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  
  // Expense state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  // Get month and year from selected date
  const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
  const year = selectedDate.getFullYear();

  // Fetch wallets
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
    enabled: !!user,
  });

  // Calculate total balance
  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.balance),
    0
  );

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

  // Fetch budget for current month/year
  const { data: currentBudget } = useQuery<Budget>({
    queryKey: ["/api/budgets/current"],
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

  // Wallet form validation schema
  const walletFormSchema = z.object({
    name: z.string().min(1, t("validation.name_required")),
    balance: z.string().refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      t("validation.amount_positive")
    ),
  });

  // Initialize the wallet form
  const walletForm = useForm<z.infer<typeof walletFormSchema>>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: "",
      balance: "0",
    },
  });

  // Reset form when editing wallet changes
  useEffect(() => {
    if (editingWallet) {
      walletForm.reset({
        name: editingWallet.name,
        balance: String(editingWallet.balance),
      });
    } else {
      walletForm.reset({
        name: "",
        balance: "0",
      });
    }
  }, [editingWallet, walletForm]);

  // Budget form validation schema
  const budgetFormSchema = z.object({
    amount: z.string().min(1, t("validation.amount_required")).refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      t("validation.amount_positive")
    ),
  });

  // Initialize the budget form
  const budgetForm = useForm<z.infer<typeof budgetFormSchema>>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      amount: currentBudget ? String(currentBudget.amount) : "",
    },
  });

  // Update budget form when budget changes
  useEffect(() => {
    if (currentBudget) {
      budgetForm.setValue("amount", String(currentBudget.amount));
    }
  }, [currentBudget, budgetForm]);

  // Wallet mutation
  const walletMutation = useMutation({
    mutationFn: async (data: z.infer<typeof walletFormSchema>) => {
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
      setIsWalletDialogOpen(false);
      setEditingWallet(null);
      walletForm.reset();
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

  // Budget mutation
  const budgetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof budgetFormSchema>) => {
      const payload = {
        amount: data.amount,
        month,
        year,
        userId: user!.id,
      };

      if (currentBudget) {
        await apiRequest("PUT", `/api/budgets/${currentBudget.id}`, payload);
      } else {
        await apiRequest("POST", "/api/budgets", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      setIsBudgetDialogOpen(false);
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

  // Wallet form submission handler
  const onWalletSubmit = (values: z.infer<typeof walletFormSchema>) => {
    walletMutation.mutate(values);
  };

  // Budget form submission handler
  const onBudgetSubmit = (values: z.infer<typeof budgetFormSchema>) => {
    budgetMutation.mutate(values);
  };

  // Handle add wallet click
  const handleAddWallet = () => {
    setEditingWallet(null);
    walletForm.reset({
      name: "",
      balance: "0",
    });
    setIsWalletDialogOpen(true);
  };

  // Handle edit wallet click
  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    walletForm.reset({
      name: wallet.name,
      balance: String(wallet.balance),
    });
    setIsWalletDialogOpen(true);
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
  
  // Add new expense click
  const handleAddExpense = () => {
    setEditExpense(null);
    setIsAddExpenseOpen(true);
  };
  
  // Edit expense click
  const handleEditExpense = (expense: Expense) => {
    setEditExpense(expense);
    setIsAddExpenseOpen(true);
  };
  
  // Calculate budget values
  const budgetAmount = currentBudget ? Number(currentBudget.amount) : 0;
  const remainingAmount = Math.max(budgetAmount - totalMonthlyExpenses, 0);
  const savedAmount = currentBudget ? (budgetAmount > totalMonthlyExpenses ? budgetAmount - totalMonthlyExpenses : 0) : 0;
  const usedPercentage = calculateBudgetPercentage(totalMonthlyExpenses, budgetAmount);

  // Forçar texto árabe para a página de finanças
  const pageTitle = i18n.language === 'ar' ? "المالية" : t("navigation.finance");

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-24 md:pb-0 overflow-y-auto custom-scrollbar">
      <Header title={pageTitle} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Month Selector */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold mr-4 arabic-font">
              {pageTitle}
            </h2>
            <MonthSelector selected={selectedDate} onSelect={setSelectedDate} />
          </div>
        </div>
        
        <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleAddWallet} 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 p-2"
              >
                <PlusCircle className="h-6 w-6 mb-2" />
                <span className="text-xs text-center arabic-font">إضافة محفظة</span>
              </Button>
              
              <Button 
                onClick={() => setIsBudgetDialogOpen(true)} 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 p-2"
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                <span className="text-xs text-center">{currentBudget ? t("budget.edit_budget") : t("budget.add_budget")}</span>
              </Button>
            </div>
            
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet Balance Card */}
              <Card className="bg-secondary dark:bg-secondary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">
                    <TranslatedText i18nKey="finance.total_balance">Saldo Total</TranslatedText>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white mb-2">
                    {formatMoney(totalBalance)}
                  </p>
                  <p className="text-white/80 text-sm">
                    {wallets.length} <TranslatedText i18nKey="wallet.wallets" tag="span">محافظ</TranslatedText>
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-white border-white/30 hover:bg-white/10"
                    onClick={handleAddWallet}
                  >
                    <TranslatedText i18nKey="wallet.add_wallet">إضافة محفظة</TranslatedText>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Budget Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      <TranslatedText i18nKey="budget.monthly_budget">الميزانية الشهرية</TranslatedText>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsBudgetDialogOpen(true)}
                      className="text-secondary dark:text-accent h-8"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      <TranslatedText i18nKey="common.edit">تعديل</TranslatedText>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!currentBudget ? (
                    <div className="text-center py-4">
                      <p className="text-neutral-500 dark:text-neutral-400 mb-4">{t("budget.setup_budget")}</p>
                      <Button onClick={() => setIsBudgetDialogOpen(true)} variant="secondary">
                        {t("budget.add_budget")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t("budget.income")}</p>
                          <p className="text-lg font-semibold text-neutral-800 dark:text-white">
                            {formatMoney(budgetAmount)}
                          </p>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t("budget.expenses")}</p>
                          <p className="text-lg font-semibold text-red-500">
                            {formatMoney(totalMonthlyExpenses)}
                          </p>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t("budget.remaining")}</p>
                          <p className="text-lg font-semibold text-green-500">
                            {formatMoney(remainingAmount)}
                          </p>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t("budget.saved")}</p>
                          <p className="text-lg font-semibold text-secondary dark:text-accent">
                            {formatMoney(savedAmount)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-600 dark:text-neutral-400">{t("budget.budget_used")}</span>
                          <span className="text-neutral-800 dark:text-white font-medium">{usedPercentage}%</span>
                        </div>
                        <Progress value={usedPercentage} className="h-2.5" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Expenses & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense Chart */}
              {monthlyExpenses.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("expense.distribution")}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ExpenseChart expenses={monthlyExpenses} categories={categories} />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("expense.distribution")}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-10 text-center">
                    <p className="text-neutral-500 dark:text-neutral-400">{t("expense.no_expenses_for_chart")}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Recent Expenses List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle>{t("finance.recent_expenses")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 dark:text-neutral-400">{t("expense.no_expenses")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {monthlyExpenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map((expense) => {
                          const category = categories.find((c) => c.id === expense.categoryId);
                          return (
                            <div
                              key={expense.id}
                              className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <div className="flex items-center">
                                <div
                                  className="w-8 h-8 rounded-full mr-3 flex items-center justify-center"
                                  style={{
                                    backgroundColor: `${category?.color}20`,
                                    color: category?.color,
                                  }}
                                >
                                  <i className={`fas fa-${category?.icon}`}></i>
                                </div>
                                <div>
                                  <p className="font-medium">{expense.description}</p>
                                </div>
                              </div>
                              <p
                                className={`font-semibold ${expense.isPaid ? "line-through opacity-60" : ""}`}
                              >
                                {formatMoney(Number(expense.amount))}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
        </div>
      </main>

      <MobileNavigation />
      
      {/* Wallet Dialog */}
      <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingWallet ? t("wallet.edit_wallet") : t("wallet.add_wallet")}
            </DialogTitle>
          </DialogHeader>

          <Form {...walletForm}>
            <form onSubmit={walletForm.handleSubmit(onWalletSubmit)} className="space-y-4">
              <FormField
                control={walletForm.control}
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
                control={walletForm.control}
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
                  onClick={() => setIsWalletDialogOpen(false)}
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
      
      {/* Budget Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentBudget ? t("budget.edit_budget") : t("budget.add_budget")}
            </DialogTitle>
          </DialogHeader>

          <Form {...budgetForm}>
            <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-4">
              <FormField
                control={budgetForm.control}
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
                  onClick={() => setIsBudgetDialogOpen(false)}
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
      
      {/* Delete Wallet Confirmation */}
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
      
      {/* Add/Edit Expense Dialog */}
      <AddExpenseDialog 
        open={isAddExpenseOpen} 
        onOpenChange={setIsAddExpenseOpen} 
        editExpense={editExpense}
      />
    </div>
  );
}