import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Expense, Category } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { MonthSelector } from "@/components/month-selector";
import { BudgetOverview } from "@/components/budget-overview";
import { ExpensesList } from "@/components/expenses-list";
import { ExpenseChart } from "@/components/expense-chart";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/add-expense-dialog";

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
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
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
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

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-16 md:pb-0">
      <Header title={t("navigation.home")} />
      
      {/* Sub Header with Date and Add Button */}
      <div className="bg-white dark:bg-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Date selector */}
            <MonthSelector 
              selected={selectedDate} 
              onSelect={setSelectedDate} 
            />

            {/* Add expense button */}
            <Button
              className="bg-secondary hover:bg-secondary/90 text-white py-1 px-3 rounded-md flex items-center space-x-1"
              onClick={() => setIsAddExpenseOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>{t("common.add")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Budget Overview */}
        <BudgetOverview
          month={month}
          year={year}
          totalExpenses={totalExpenses}
        />
        
        {/* Expenses List */}
        <ExpensesList 
          expenses={monthlyExpenses} 
          categories={categories} 
        />
        
        {/* Expense Chart */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-heading font-semibold text-neutral-800 dark:text-white mb-4">
            {t("expense.distribution")}
          </h2>
          
          <ExpenseChart 
            expenses={monthlyExpenses} 
            categories={categories} 
          />
        </div>
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
