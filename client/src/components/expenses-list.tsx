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
          {t("expense.expenses")}
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
      
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {t("expense.no_expenses")}
            </p>
          </div>
        ) : (
          filteredExpenses.map(expense => {
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
