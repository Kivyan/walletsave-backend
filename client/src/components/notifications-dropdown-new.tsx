import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, AlertTriangle, Calendar, Clock } from "lucide-react";
import { TranslatedText } from "@/components/translated-text";
import { useQuery } from "@tanstack/react-query";
import { Expense, Category } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<number[]>([]);
  
  // Query para buscar despesas
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });
  
  // Query para buscar categorias
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Carregar notificações visualizadas do localStorage
  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem('viewedNotifications');
      if (storedNotifications) {
        setViewedNotifications(JSON.parse(storedNotifications));
      }
    } catch (error) {
      console.error("Error loading viewed notifications:", error);
    }
  }, []);
  
  // Obter data atual e data de uma semana à frente
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // Filtrar próximas despesas não pagas
  const upcomingExpenses = expenses?.filter(expense => {
    if (!expense) return false;
    const expenseDate = new Date(expense.date);
    expenseDate.setHours(0, 0, 0, 0);
    return !expense.isPaid && expenseDate >= today && expenseDate <= nextWeek;
  }) || [];
  
  // Ordenar por data mais próxima
  const sortedExpenses = [...upcomingExpenses].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Limitar a 5 notificações
  const limitedExpenses = sortedExpenses.slice(0, 5);
  
  // Filtrar despesas não visualizadas
  const unviewedExpenses = limitedExpenses.filter(
    expense => !viewedNotifications.includes(expense.id)
  );
  
  // Quando as notificações forem abertas, marcar todas como lidas
  useEffect(() => {
    if (isOpen && limitedExpenses.length > 0) {
      const notificationIds = limitedExpenses.map(expense => expense.id);
      const newViewedIds = [...viewedNotifications];
      
      notificationIds.forEach(id => {
        if (!newViewedIds.includes(id)) {
          newViewedIds.push(id);
        }
      });
      
      setViewedNotifications(newViewedIds);
      localStorage.setItem('viewedNotifications', JSON.stringify(newViewedIds));
    }
  }, [isOpen, limitedExpenses]);
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="relative text-neutral-500 dark:text-neutral-300">
        <Bell className="h-5 w-5" />
        {unviewedExpenses.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {unviewedExpenses.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-medium text-neutral-800 dark:text-white">
            <TranslatedText i18nKey="notifications.title">الإشعارات</TranslatedText>
          </h3>
        </div>
        
        {limitedExpenses.length === 0 ? (
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
                      {isToday ? <Calendar className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
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