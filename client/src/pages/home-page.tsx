import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Expense, Category, Wallet as WalletType, Saving, Budget } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { MonthSelector } from "@/components/month-selector";
import { ExpensesList } from "@/components/expenses-list";
import { ExpenseChart } from "@/components/expense-chart";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NotificationService from "@/components/notification-service";
import { formatMoney, calculateBudgetPercentage } from "@/lib/utils";

import { ReactElement } from "react";

export default function HomePage(): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  
  // Get month and year from selected date
  const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
  const year = selectedDate.getFullYear();

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });
  
  // Fetch budget for current month/year
  const { data: currentBudget } = useQuery<Budget>({
    queryKey: ["/api/budgets/current"],
    enabled: !!user,
  });
  
  // Fetch wallets for notification service
  const { data: wallets = [] } = useQuery<WalletType[]>({
    queryKey: ["/api/wallets"],
    enabled: !!user,
  });
  
  // Fetch savings for notification service
  const { data: savings = [] } = useQuery<Saving[]>({
    queryKey: ["/api/savings"],
    enabled: !!user,
  });
  
  // Mutação para criar categorias padrão
  const createDefaultCategoriesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/categories/default");
    },
    onSuccess: () => {
      refetchCategories();
      toast({
        title: t("categories.created_success"),
        description: t("categories.created_description") || "Categorias padrão criadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("categories.created_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter expenses for the selected month
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() + 1 === month && 
      expenseDate.getFullYear() === year
    );
  });

  // Calculate total expenses for the month
  const totalExpenses = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount), 
    0
  );
  
  // Calculate total balance
  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.balance),
    0
  );
  
  // Função para criar categorias padrão
  const handleCreateDefaultCategories = () => {
    createDefaultCategoriesMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-24 md:pb-0 overflow-y-auto custom-scrollbar">
      <Header title={t("navigation.home")} />
      
      {/* Sub Header with Date and Add Button */}
      <div className="bg-white dark:bg-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Date selector */}
            <div className="flex items-center gap-4">
              <MonthSelector 
                selected={selectedDate} 
                onSelect={setSelectedDate} 
              />
              
              {/* Notification Service */}
              <div className="hidden md:block">
                <NotificationService 
                  expenseData={expenses}
                  budgetData={currentBudget}
                  walletData={wallets}
                  savingsData={savings}
                />
              </div>
            </div>

            {/* Add expense button */}
            <Button
              className="bg-secondary hover:bg-secondary/90 text-white py-1 px-3 rounded-md flex items-center space-x-1"
              onClick={() => setIsAddExpenseOpen(true)}
            >
              <Icons.Plus className="h-4 w-4" />
              <span>{t("common.add")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {categories && categories.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mb-6">
            <div className="text-center">
              <Icons.Folders className="h-12 w-12 mx-auto text-neutral-400" />
              <h2 className="mt-2 text-xl font-semibold text-neutral-800 dark:text-white">
                Sem categorias disponíveis
              </h2>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Você precisa criar categorias antes de adicionar despesas.
              </p>
              <Button
                className="mt-4"
                onClick={handleCreateDefaultCategories}
                disabled={createDefaultCategoriesMutation.isPending}
              >
                {createDefaultCategoriesMutation.isPending ? "Criando..." : "Criar Categorias Padrão"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Access Navigation Buttons */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <Link href="/reports" className="bg-white dark:bg-neutral-800 rounded-lg shadow flex flex-col items-center justify-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-neutral-800 dark:text-white font-medium">{t("navigation.reports")}</span>
              </Link>
              
              <Link href="/savings" className="bg-white dark:bg-neutral-800 rounded-lg shadow flex flex-col items-center justify-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-neutral-800 dark:text-white font-medium">{t("navigation.savings")}</span>
              </Link>
            </div>
            
            {/* Finance Overview (redesenhado e simplificado) */}
            <div className="mb-6 bg-white dark:bg-neutral-800 rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-0">
                <h2 className="text-lg font-heading font-semibold text-neutral-800 dark:text-white mb-4 md:mb-0">
                  {t("finance.financial_summary")}
                </h2>
                <div className="flex space-x-2">
                  <Link href="/finance" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    {t("common.edit")}
                  </Link>
                </div>
              </div>
              
              {/* Finance Info Cards - Simplificado em linha única */}
              <div className="flex flex-wrap items-center mt-4">
                {/* Wallet Balance */}
                <div className="flex items-center mr-8 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                    <Icons.Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t("wallet.balance")}</div>
                    <div className="text-lg font-bold">{formatMoney(totalBalance)}</div>
                  </div>
                </div>
                
                {/* Monthly Budget */}
                <div className="flex items-center mr-8 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                    <Icons.LineChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t("budget.budget")}</div>
                    <div className="text-lg font-bold">
                      {currentBudget ? formatMoney(Number(currentBudget.amount)) : "--"}
                    </div>
                  </div>
                </div>
                
                {/* Monthly Expenses */}
                <div className="flex items-center mr-8 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                    <Icons.Receipt className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t("expense.expenses")}</div>
                    <div className="text-lg font-bold">{formatMoney(totalExpenses)}</div>
                  </div>
                </div>
                
                {/* Usage Percentage */}
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                    <Icons.Percent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t("budget.budget_used")}</div>
                    <div className="text-lg font-bold">
                      {currentBudget ? calculateBudgetPercentage(totalExpenses, Number(currentBudget.amount)) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Expenses List - Mostrar todas as despesas */}
            <ExpensesList 
              expenses={expenses} 
              categories={categories} 
            />
            
            {/* Expense Chart */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-heading font-semibold text-neutral-800 dark:text-white mb-4">
                {t("expense.distribution")}
              </h2>
              
              <ExpenseChart 
                expenses={expenses} 
                categories={categories} 
              />
            </div>
          </>
        )}
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
      />
    </div>
  );
}