import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faBellSlash } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Expense, Wallet, Saving, Budget } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
} from '@/components/ui/dialog';

// Função auxiliar para verificar se o navegador suporta notificações
const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Função auxiliar para solicitar permissão de notificação
const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'denied';
  
  if (Notification.permission === 'granted') return 'granted';
  
  const permission = await Notification.requestPermission();
  return permission;
};

interface NotificationServiceProps {
  expenseData: Expense[];
  budgetData: Budget | undefined;
  walletData: Wallet[];
  savingsData: Saving[];
}

export default function NotificationService({ 
  expenseData, 
  budgetData, 
  walletData,
  savingsData
}: NotificationServiceProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  
  // Estado para o último mês analisado, para não repetir notificações
  const [lastChecked, setLastChecked] = useState({
    budget: '',
    savings: '',
    expenses: '',
  });
  
  // Verificar status de permissões ao carregar
  useEffect(() => {
    if (isNotificationSupported()) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);
  
  // Análises financeiras para gerar notificações
  useEffect(() => {
    if (!notificationsEnabled || !user) return;
    
    // Verificar orçamento vs. despesas
    if (budgetData && expenseData) {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
      
      // Calcular despesas do mês atual
      const currentMonthExpenses = expenseData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === currentDate.getMonth() && 
          expenseDate.getFullYear() === currentDate.getFullYear()
        );
      });
      
      const totalExpenses = currentMonthExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount), 0
      );
      
      // Se o orçamento existir
      if (budgetData && budgetData.amount) {
        const budgetAmount = Number(budgetData.amount);
        const budgetKey = `budget-${currentMonth}`;
        
        // Verificar se estamos acima de 80% do orçamento
        if (totalExpenses > (budgetAmount * 0.8) && lastChecked.budget !== budgetKey) {
          const percentUsed = Math.round((totalExpenses / budgetAmount) * 100);
          
          showNotification(
            t('notifications.budget_warning_title'),
            t('notifications.budget_warning_body', { percent: percentUsed })
          );
          
          setLastChecked(prev => ({ ...prev, budget: budgetKey }));
        }
        
        // Verificar se as despesas ultrapassaram o orçamento
        if (totalExpenses > budgetAmount && lastChecked.budget !== `${budgetKey}-exceeded`) {
          showNotification(
            t('notifications.budget_exceeded_title'),
            t('notifications.budget_exceeded_body')
          );
          
          setLastChecked(prev => ({ ...prev, budget: `${budgetKey}-exceeded` }));
        }
      }
    }
    
    // Verificar economias
    if (savingsData && savingsData.length > 0) {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
      
      // Verificar metas de economia atingidas
      savingsData.forEach(saving => {
        const savingKey = `saving-goal-${saving.id}-${currentMonth}`;
        const currentAmount = Number(saving.currentAmount);
        const targetAmount = Number(saving.targetAmount);
        
        // Verificar se a meta foi atingida (ou ultrapassada)
        if (currentAmount >= targetAmount && lastChecked.savings !== savingKey) {
          showNotification(
            t('notifications.saving_goal_reached_title'),
            t('notifications.saving_goal_reached_body', { 
              name: saving.name,
              amount: targetAmount.toFixed(2)
            })
          );
          
          setLastChecked(prev => ({ ...prev, savings: savingKey }));
        }
        
        // Verificar se estamos próximos de atingir a meta (90%)
        else if (currentAmount >= (targetAmount * 0.9) && currentAmount < targetAmount && 
                 lastChecked.savings !== `${savingKey}-near`) {
          showNotification(
            t('notifications.saving_goal_near_title'),
            t('notifications.saving_goal_near_body', { 
              name: saving.name,
              percent: Math.round((currentAmount / targetAmount) * 100)
            })
          );
          
          setLastChecked(prev => ({ ...prev, savings: `${savingKey}-near` }));
        }
      });
      
      // Também manter a notificação geral sobre economias
      const savingsKey = `savings-general-${currentMonth}`;
      if (lastChecked.savings !== savingsKey) {
        // Lógica simples: se temos economias este mês, mostrar uma notificação positiva
        showNotification(
          t('notifications.savings_title'),
          t('notifications.savings_body')
        );
        
        setLastChecked(prev => ({ ...prev, savings: savingsKey }));
      }
    }
    
    // Verificar carteiras e alertar se saldo for insuficiente para despesas pendentes
    if (walletData && walletData.length > 0 && expenseData && expenseData.length > 0) {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
      
      // Calcular saldo total disponível
      const totalBalance = walletData.reduce(
        (sum, wallet) => sum + Number(wallet.balance), 0
      );
      
      // Calcular despesas pendentes (não pagas) deste mês
      const pendingExpenses = expenseData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
          !expense.isPaid &&
          expenseDate.getMonth() === currentDate.getMonth() && 
          expenseDate.getFullYear() === currentDate.getFullYear()
        );
      });
      
      const totalPendingAmount = pendingExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount), 0
      );
      
      // Verificar se o saldo é suficiente para cobrir despesas pendentes
      const expensesKey = `expenses-${currentMonth}`;
      if (totalBalance < totalPendingAmount && lastChecked.expenses !== expensesKey) {
        showNotification(
          t('notifications.insufficient_funds_title'),
          t('notifications.insufficient_funds_body', {
            pending: totalPendingAmount.toFixed(2),
            available: totalBalance.toFixed(2)
          })
        );
        
        setLastChecked(prev => ({ ...prev, expenses: expensesKey }));
      }
    }
  }, [notificationsEnabled, budgetData, expenseData, walletData, savingsData, user, t]);
  
  // Função para mostrar notificação no navegador
  const showNotification = (title: string, body: string) => {
    if (!notificationsEnabled) return;
    
    try {
      // Mostrar notificação do navegador
      const notification = new Notification(title, {
        body: body,
        icon: '/logo.png',
      });
      
      // Foco na aplicação quando clicada
      notification.onclick = function() {
        window.focus();
        notification.close();
      };
      
      // Também mostrar no app como toast
      toast({
        title,
        description: body,
      });
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
    }
  };
  
  // Função para ativar notificações
  const enableNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast({
        title: t('notifications.enabled_title'),
        description: t('notifications.enabled_description'),
      });
    } else {
      setShowPermissionDialog(true);
    }
  };
  
  if (!user) return null;
  
  return (
    <>
      {!notificationsEnabled && (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={enableNotifications}
        >
          <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
          <span>{t('notifications.enable')}</span>
        </Button>
      )}
      
      {notificationsEnabled && (
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-green-600"
        >
          <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
          <span>{t('notifications.enabled')}</span>
        </Button>
      )}
      
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('notifications.permission_title')}</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            {t('notifications.permission_description')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}