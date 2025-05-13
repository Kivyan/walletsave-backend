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

// Interface para notificações de metas de economia
interface SavingGoalNotification {
  id: string;
  savingId: number;
  savingName: string;
  targetAmount: number;
  currentAmount: number;
  isCompleted: boolean;
  timestamp: number;
  viewed: boolean;
}

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<number[]>([]);
  
  // Estado para armazenar notificações de metas de economia
  const [savingNotifications, setSavingNotifications] = useState<SavingGoalNotification[]>([]);
  
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
  
  // Carregar notificações de metas de economia do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('savingGoalNotifications');
      if (stored) {
        setSavingNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar notificações de metas:", error);
    }
  }, []);
  
  // Salvar notificações de metas no localStorage
  useEffect(() => {
    if (savingNotifications.length > 0) {
      localStorage.setItem('savingGoalNotifications', JSON.stringify(savingNotifications));
    }
  }, [savingNotifications]);
  
  // Monitorar alterações nas metas de economia para gerar notificações
  useEffect(() => {
    if (!savings || savings.length === 0) return;
    
    console.log("Verificando metas de economia:", savings);
    
    // Para cada meta de economia, verificar se atingiu o objetivo
    savings.forEach(saving => {
      const currentAmount = Number(saving.currentAmount);
      const targetAmount = Number(saving.targetAmount);
      
      console.log(`Meta ${saving.name}: ${currentAmount}/${targetAmount}`);
      console.log(`Notificações atuais:`, savingNotifications);
      
      // Verificar se já temos uma notificação para esta meta atingida
      const existingCompletedNotification = savingNotifications.find(
        n => n.savingId === saving.id && n.isCompleted
      );
      
      // Verificar se já temos uma notificação de 90% para esta meta
      const existingNearNotification = savingNotifications.find(
        n => n.savingId === saving.id && !n.isCompleted && n.currentAmount >= targetAmount * 0.9
      );
      
      console.log(`Meta ${saving.name} já tem notificação completa:`, !!existingCompletedNotification);
      console.log(`Meta ${saving.name} já tem notificação próxima:`, !!existingNearNotification);
      
      // Meta atingida (sem notificação anterior)
      if (currentAmount >= targetAmount && !existingCompletedNotification) {
        console.log(`Adicionando notificação para meta atingida: ${saving.name}`);
        
        // Mostrar um toast também para feedback imediato
        toast({
          title: t('notifications.saving_goal_reached_title'),
          description: t('notifications.saving_goal_reached_body', { 
            name: saving.name,
            amount: targetAmount.toFixed(2)
          }),
          variant: "default"
        });
        
        // Adicionar notificação de meta atingida
        const newNotification: SavingGoalNotification = {
          id: `saving-completed-${saving.id}-${Date.now()}`,
          savingId: saving.id,
          savingName: saving.name,
          targetAmount,
          currentAmount,
          isCompleted: true,
          timestamp: Date.now(),
          viewed: false
        };
        
        setSavingNotifications(prev => [newNotification, ...prev]);
      }
      // Próximo de atingir a meta (90%), sem notificações anteriores
      else if (currentAmount >= targetAmount * 0.9 && currentAmount < targetAmount && 
               !existingNearNotification && !existingCompletedNotification) {
        console.log(`Adicionando notificação para meta próxima: ${saving.name}`);
        
        // Mostrar um toast também para feedback imediato
        toast({
          title: t('notifications.saving_goal_near_title'),
          description: t('notifications.saving_goal_near_body', { 
            name: saving.name,
            percent: Math.round((currentAmount / targetAmount) * 100)
          }),
          variant: "default"
        });
        
        // Adicionar notificação de próximo de meta
        const newNotification: SavingGoalNotification = {
          id: `saving-near-${saving.id}-${Date.now()}`,
          savingId: saving.id,
          savingName: saving.name,
          targetAmount,
          currentAmount,
          isCompleted: false,
          timestamp: Date.now(),
          viewed: false
        };
        
        setSavingNotifications(prev => [newNotification, ...prev]);
      }
    });
  }, [savings, savingNotifications, t, toast]);
  
  // Quando o dropdown é aberto, marcar todas as notificações como visualizadas
  useEffect(() => {
    if (isOpen) {
      // Marcar notificações de despesas como visualizadas
      if (upcomingExpenses?.length) {
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
      
      // Marcar notificações de metas como visualizadas
      if (savingNotifications.some(n => !n.viewed)) {
        setSavingNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            viewed: true
          }))
        );
      }
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
  
  // Esta função foi substituída pela verificação automática que ocorre quando 
  // o usuário atualiza seus valores de economias ou quando os dados são carregados
  // Ao invés do usuário ter que apertar um botão, o sistema notifica automaticamente
  
  // Filtrar notificações de metas não visualizadas
  const unviewedSavingNotifications = savingNotifications.filter(n => !n.viewed);
  
  // Total de notificações não visualizadas
  const totalUnviewedNotifications = (unviewedExpenses?.length || 0) + unviewedSavingNotifications.length;
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="relative text-neutral-500 dark:text-neutral-300">
        <Bell className="h-5 w-5" />
        {totalUnviewedNotifications > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {totalUnviewedNotifications}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-medium text-neutral-800 dark:text-white">
            {t("notifications.title")}
          </h3>
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
        
        {/* Seção de notificações de metas de economia */}
        {savingNotifications.length > 0 && (
          <>
            <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-medium text-neutral-800 dark:text-white">
                {t("notifications.saving_goals")}
              </h4>
            </div>
            
            {savingNotifications.map((notification) => {
              // Calcular o ícone e as cores com base no tipo de notificação
              const isCompleted = notification.isCompleted;
              const iconColor = isCompleted ? "text-green-500" : "text-yellow-500";
              const bgColor = isCompleted ? "bg-green-100 dark:bg-green-900/30" : "bg-yellow-100 dark:bg-yellow-900/30";
              const icon = isCompleted ? "check-circle" : "circle-dollar-sign";
              
              return (
                <div 
                  key={notification.id}
                  className="px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex">
                    <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${iconColor} mr-3`}>
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        {isCompleted 
                          ? t("notifications.saving_goal_reached_body", { 
                              name: notification.savingName,
                              amount: notification.targetAmount.toFixed(2)
                            })
                          : t("notifications.saving_goal_near_body", { 
                              name: notification.savingName,
                              percent: Math.round((notification.currentAmount / notification.targetAmount) * 100)
                            })}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
