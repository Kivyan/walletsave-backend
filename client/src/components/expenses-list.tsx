import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Expense, Category } from "@shared/schema";
import { ExpenseItem } from "@/components/expense-item";
import { CategoryFilter } from "@/components/category-filter";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpensesListProps {
  expenses: Expense[];
  categories: Category[];
}

export function ExpensesList({ expenses, categories }: ExpensesListProps) {
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    categories.map(category => category.id)
  );
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filter expenses by selected categories
  const filteredExpenses = expenses.filter(expense => 
    selectedCategories.includes(expense.categoryId)
  );
  
  // Função para ordenar despesas por data (da mais recente para a mais antiga)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Função para agrupar despesas por data
  const groupExpensesByDate = () => {
    const groups: {[key: string]: Expense[]} = {};
    
    sortedExpenses.forEach(expense => {
      const date = new Date(expense.date).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
    });
    
    return groups;
  };
  
  const expenseGroups = groupExpensesByDate();

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsAddExpenseOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddExpenseOpen(true);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-heading font-semibold text-neutral-800 dark:text-white">
          {t("expenses.my_expenses")}
        </h2>
        
        <div className="flex items-center space-x-2">
          <CategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onSelectCategories={setSelectedCategories}
          />
          
          <Button
            size="sm"
            className="bg-secondary hover:bg-secondary/90 text-white py-1 px-3 rounded-md flex items-center space-x-1"
            onClick={handleAddExpense}
          >
            <Plus className="h-4 w-4" />
            <span>{t("common.add")}</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {t("expenses.no_expenses")}
            </p>
          </div>
        ) : (
          Object.entries(expenseGroups).map(([dateStr, expenses]) => {
            const date = new Date(dateStr);
            const today = new Date();
            const isToday = 
              date.getDate() === today.getDate() && 
              date.getMonth() === today.getMonth() && 
              date.getFullYear() === today.getFullYear();
              
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const isTomorrow = 
              date.getDate() === tomorrow.getDate() && 
              date.getMonth() === tomorrow.getMonth() && 
              date.getFullYear() === tomorrow.getFullYear();
              
            let dateLabel = '';
            if (isToday) {
              dateLabel = t('common.today');
            } else if (isTomorrow) {
              dateLabel = t('common.tomorrow');
            } else {
              dateLabel = new Date(dateStr).toLocaleDateString(undefined, { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              });
            }
            
            return (
              <div key={dateStr} className="bg-white dark:bg-neutral-800 rounded-lg shadow">
                <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-700 flex items-center">
                  <span className="font-medium text-neutral-800 dark:text-white">
                    {dateLabel}
                  </span>
                  <span className="ml-2 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-xs text-neutral-600 dark:text-neutral-300">
                    {expenses.length}
                  </span>
                </div>
                
                <div className="space-y-0 divide-y divide-neutral-100 dark:divide-neutral-700">
                  {expenses.map(expense => {
                    const category = categories.find(c => c.id === expense.categoryId);
                    if (!category) return null;
                    
                    return (
                      <ExpenseItem 
                        key={expense.id} 
                        expense={expense} 
                        category={category}
                        onEdit={handleEditExpense}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        editExpense={editingExpense}
      />
    </div>
  );
}
