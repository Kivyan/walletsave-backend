import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Expense, Category, Saving, Budget, Wallet } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<number[]>([]);
  
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const { data: savings = [] } = useQuery<Saving[]>({
    queryKey: ["/api/savings"],
  });
  
  const { data: currentBudget } = useQuery<Budget>({
    queryKey: ["/api/budgets/current"],
  });
  
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
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
  
  // Carregar notificações visualizadas do localStorage
  useEffect(() => {
    const storedNotifications = localStorage.getItem('viewedNotifications');
    if (storedNotifications) {
      setViewedNotifications(JSON.parse(storedNotifications));
    }
  }, []);
  
  // Salvar notificações visualizadas no localStorage
  useEffect(() => {
    if (viewedNotifications.length > 0) {
      localStorage.setItem('viewedNotifications', JSON.stringify(viewedNotifications));
    }
  }, [viewedNotifications]);
  
  // Quando o dropdown é aberto, marcar todas as notificações como visualizadas
  useEffect(() => {
    if (isOpen && upcomingExpenses?.length) {
      const newViewedIds = upcomingExpenses.map(expense => expense.id);
      setViewedNotifications(prev => {
        // Combinar arrays e remover duplicatas manualmente
        const combined = [...prev];
        for (const id of newViewedIds) {
          if (!combined.includes(id)) {
            combined.push(id);
          }
        }
        return combined;
      });
    }
  }, [isOpen, upcomingExpenses]);
  
  // Sort by closest due date
  upcomingExpenses?.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Limit to first 5
  const limitedExpenses = upcomingExpenses?.slice(0, 5);
  
  // Filtrar as notificações não visualizadas
  const unviewedExpenses = limitedExpenses?.filter(
    expense => !viewedNotifications.includes(expense.id)
  );
  
  // Função para verificar as metas de economia
  const checkSavingsGoals = () => {
    if (savings.length === 0) {
      toast({
        title: "Nenhuma Meta",
        description: "Nenhuma meta de economia encontrada para verificar.",
        variant: "default"
      });
      return;
    }
    
    // Notificação de verificação iniciada
    toast({
      title: "Verificando Metas",
      description: "Verificando o progresso das suas metas de economia...",
      variant: "default"
    });
    
    let goalReached = false;
    let nearGoal = false;
    
    // Verificar cada meta de economia
    savings.forEach(saving => {
      const currentAmount = typeof saving.currentAmount === 'string' 
        ? parseFloat(saving.currentAmount) 
        : Number(saving.currentAmount);
      const targetAmount = typeof saving.targetAmount === 'string' 
        ? parseFloat(saving.targetAmount) 
        : Number(saving.targetAmount);
      
      console.log(`Verificando meta ${saving.name}: ${currentAmount}/${targetAmount}`);
      
      // Meta atingida
      if (currentAmount >= targetAmount) {
        goalReached = true;
        toast({
          title: t('notifications.saving_goal_reached_title'),
          description: t('notifications.saving_goal_reached_body', { 
            name: saving.name,
            amount: targetAmount.toFixed(2)
          }),
          variant: "default"
        });
      }
      // Próximo de atingir a meta (90%)
      else if (currentAmount >= targetAmount * 0.9) {
        nearGoal = true;
        toast({
          title: t('notifications.saving_goal_near_title'),
          description: t('notifications.saving_goal_near_body', { 
            name: saving.name,
            percent: Math.round((currentAmount / targetAmount) * 100)
          }),
          variant: "default"
        });
      }
    });
    
    // Se nenhuma meta estiver próxima ou atingida
    if (!goalReached && !nearGoal) {
      toast({
        title: "Progresso de Metas",
        description: "Suas metas de economia ainda estão em progresso. Continue economizando!",
        variant: "default"
      });
    }
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="relative text-neutral-500 dark:text-neutral-300">
        <Bell className="h-5 w-5" />
        {unviewedExpenses && unviewedExpenses.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {unviewedExpenses.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-medium text-neutral-800 dark:text-white">
            {t("notifications.title")}
          </h3>
        </div>
        
        {/* Seção para verificar metas de economia */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-medium text-neutral-800 dark:text-white">
              Verificar Metas de Economia
            </h4>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            Atualize valores da meta e clique para verificar seu progresso
          </p>
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-full text-xs" 
            onClick={checkSavingsGoals}
          >
            Verificar Metas
          </Button>
        </div>
        
        {/* Seção de despesas próximas */}
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <h4 className="text-sm font-medium text-neutral-800 dark:text-white">
            Despesas Próximas
          </h4>
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
