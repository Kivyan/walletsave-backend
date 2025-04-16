import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Expense, Category } from "@shared/schema";
import { formatDate } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Get current date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get date 7 days from now
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // Filter expenses due today or in the next 7 days
  const upcomingExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.date);
    expenseDate.setHours(0, 0, 0, 0);
    return !expense.isPaid && expenseDate >= today && expenseDate <= nextWeek;
  });
  
  // Sort by closest due date
  upcomingExpenses?.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Limit to first 5
  const limitedExpenses = upcomingExpenses?.slice(0, 5);
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="relative text-neutral-500 dark:text-neutral-300">
        <Bell className="h-5 w-5" />
        {limitedExpenses && limitedExpenses.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {limitedExpenses.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-medium text-neutral-800 dark:text-white">
            {t("notifications.title")}
          </h3>
        </div>
        
        {!limitedExpenses || limitedExpenses.length === 0 ? (
          <div className="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400">
            {t("notifications.no_notifications")}
          </div>
        ) : (
          <>
            {limitedExpenses.map((expense) => {
              const category = categories?.find(c => c.id === expense.categoryId);
              const isToday = new Date(expense.date).toDateString() === today.toDateString();
              const iconColor = isToday ? "text-red-500" : "text-yellow-500";
              const bgColor = isToday ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30";
              
              return (
                <div 
                  key={expense.id}
                  className="px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex">
                    <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${iconColor} mr-3`}>
                      <i className={`fas fa-${isToday ? 'calendar-exclamation' : 'exclamation-triangle'}`}></i>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        {isToday 
                          ? t("notifications.due_today", { description: expense.description })
                          : t("notifications.upcoming_expense", { description: expense.description, date: formatDate(expense.date) })}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {category?.name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="px-4 py-2 text-center">
              <a href="#" className="text-sm text-secondary dark:text-accent hover:underline">
                {t("notifications.view_all")}
              </a>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
