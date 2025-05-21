import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Expense, Wallet, Saving, Budget } from "@shared/schema";
import { TranslatedText } from '@/components/translated-text';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
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
    savingGoals: {} as Record<string, boolean>, // Novo estado para acompanhar cada meta de economia individualmente
  });
  
  // Verificar status de permissões ao carregar
  useEffect(() => {
    if (isNotificationSupported()) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);
  
  // Análises financeiras para gerar notificações
  useEffect(() => {
    if (!user) return;
    
    // Verificar orçamento vs. despesas
    if (budgetData && expenseData.length > 0) {
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
          
          showToastNotification(
            t('notifications.budget_warning_title'),
            t('notifications.budget_warning_body', { percent: percentUsed })
          );
          
          setLastChecked(prev => ({ ...prev, budget: budgetKey }));
        }
        
        // Verificar se as despesas ultrapassaram o orçamento
        if (totalExpenses > budgetAmount && lastChecked.budget !== `${budgetKey}-exceeded`) {
          showToastNotification(
            t('notifications.budget_exceeded_title'),
            t('notifications.budget_exceeded_body')
          );
          
          setLastChecked(prev => ({ ...prev, budget: `${budgetKey}-exceeded` }));
        }
      }
    }
    
    // Verificar metas de economia
    if (savingsData && savingsData.length > 0) {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
      
      // Verificar metas de economia atingidas
      savingsData.forEach(saving => {
        const savingId = saving.id.toString();
        const currentAmount = typeof saving.currentAmount === 'string' 
          ? parseFloat(saving.currentAmount) 
          : Number(saving.currentAmount);
        const targetAmount = typeof saving.targetAmount === 'string' 
          ? parseFloat(saving.targetAmount) 
          : Number(saving.targetAmount);
        
        console.log(`Verificando meta ${saving.name}: ${currentAmount}/${targetAmount}`);
        
        // Verificar se a meta foi atingida (ou ultrapassada)
        if (currentAmount >= targetAmount && !lastChecked.savingGoals[`reached-${savingId}`]) {
          console.log('Meta de economia atingida!', saving.name);
          
          showToastNotification(
            t('notifications.saving_goal_reached_title'),
            t('notifications.saving_goal_reached_body', { 
              name: saving.name,
              amount: targetAmount.toFixed(2)
            })
          );
          
          // Atualizar apenas o estado desta meta específica
          setLastChecked(prev => ({
            ...prev,
            savingGoals: {
              ...prev.savingGoals,
              [`reached-${savingId}`]: true
            }
          }));
        }
        
        // Verificar se estamos próximos de atingir a meta (90%)
        else if (currentAmount >= (targetAmount * 0.9) && currentAmount < targetAmount && 
                 !lastChecked.savingGoals[`near-${savingId}`]) {
          console.log('Próximo de atingir meta de economia!', saving.name);
          
          showToastNotification(
            t('notifications.saving_goal_near_title'),
            t('notifications.saving_goal_near_body', { 
              name: saving.name,
              percent: Math.round((currentAmount / targetAmount) * 100)
            })
          );
          
          // Atualizar apenas o estado desta meta específica
          setLastChecked(prev => ({
            ...prev,
            savingGoals: {
              ...prev.savingGoals,
              [`near-${savingId}`]: true
            }
          }));
        }
      });
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
        showToastNotification(
          t('notifications.insufficient_funds_title'),
          t('notifications.insufficient_funds_body', {
            pending: totalPendingAmount.toFixed(2),
            available: totalBalance.toFixed(2)
          })
        );
        
        setLastChecked(prev => ({ ...prev, expenses: expensesKey }));
      }
    }
  }, [budgetData, expenseData, walletData, savingsData, user, t, lastChecked]);
  
  // Mostrar notificação no toast e no navegador se habilitado
  const showToastNotification = (title: string, body: string) => {
    // Sempre mostrar um toast
    toast({
      title,
      description: body,
      variant: "default"
    });
    
    // Se notificações do navegador estiverem habilitadas, mostrar lá também
    if (notificationsEnabled) {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/logo.png',
        });
        
        notification.onclick = function() {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Erro ao mostrar notificação do navegador:', error);
      }
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
  
  // Função para forçar a verificação das metas de economia
  const forceCheckSavingsGoals = () => {
    // Resetar o estado de verificação de metas de economia
    setLastChecked(prev => ({
      ...prev,
      savingGoals: {}
    }));
    
    // Notificação de teste
    toast({
      title: t("notifications.checking_goals"),
      description: t("notifications.checking_goals_description"),
      variant: "default"
    });
    
    // Se temos dados de economias, realizar verificação imediata
    if (savingsData && savingsData.length > 0) {
      savingsData.forEach(saving => {
        const currentAmount = typeof saving.currentAmount === 'string' 
          ? parseFloat(saving.currentAmount) 
          : Number(saving.currentAmount);
        const targetAmount = typeof saving.targetAmount === 'string' 
          ? parseFloat(saving.targetAmount) 
          : Number(saving.targetAmount);
        
        console.log(`Verificando meta ${saving.name}: ${currentAmount}/${targetAmount}`);
        
        if (currentAmount >= targetAmount) {
          toast({
            title: t('notifications.saving_goal_reached_title'),
            description: t('notifications.saving_goal_reached_body', { 
              name: saving.name,
              amount: targetAmount.toFixed(2)
            }),
            variant: "default"
          });
        } else if (currentAmount >= targetAmount * 0.9) {
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
    } else {
      toast({
        title: "Nenhuma Meta",
        description: "Nenhuma meta de economia encontrada para verificar.",
        variant: "default"
      });
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2">
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
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={forceCheckSavingsGoals}
        >
          <span>Verificar Metas</span>
        </Button>
      </div>
      
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
    </div>
  );
}