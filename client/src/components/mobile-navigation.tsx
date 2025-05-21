import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import { Home, Wallet, PieChart, PiggyBank, Bell, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import NotificationService from "@/components/notification-service-fixed";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Expense, Wallet as WalletType, Saving, Budget } from "@shared/schema";
import { TranslatedText } from "@/components/translated-text";

export function MobileNavigation() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Buscar dados para as notificações
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });
  
  const { data: currentBudget } = useQuery<Budget>({
    queryKey: ["/api/budgets/current"],
    enabled: !!user,
  });
  
  const { data: wallets = [] } = useQuery<WalletType[]>({
    queryKey: ["/api/wallets"],
    enabled: !!user,
  });
  
  const { data: savings = [] } = useQuery<Saving[]>({
    queryKey: ["/api/savings"],
    enabled: !!user,
  });

  const navItems = [
    {
      href: "/",
      label: t("navigation.home"),
      icon: Home,
    },
    {
      href: "/finance",
      label: t("navigation.finance"),
      icon: DollarSign,
    },
    {
      href: "/reports",
      label: t("navigation.reports"),
      icon: PieChart,
    },
    {
      href: "/savings",
      label: t("navigation.savings"),
      icon: PiggyBank,
    },
  ];

  // Mostrar apenas na página principal
  if (location !== '/') {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 shadow-lg md:hidden z-[9999] border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-3",
                  isActive
                    ? "text-secondary dark:text-accent"
                    : "text-neutral-500 dark:text-neutral-400"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Botão de notificações - visível apenas na versão móvel */}
          <button
            className="flex flex-col items-center py-3 text-neutral-500 dark:text-neutral-400"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="h-5 w-5" />
            <span className="text-xs mt-1">{t("navigation.notifications")}</span>
          </button>
        </div>
      </nav>
      
      {/* Modal de notificações */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-6 py-2">
            <h2 className="text-lg font-medium text-center mb-4">
              <TranslatedText i18nKey="notifications.title">Notificações</TranslatedText>
            </h2>
            
            {/* Seção de verificação de metas de economia */}
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-sm font-medium mb-3"><TranslatedText i18nKey="notifications.check_saving_goals">Verificar Metas</TranslatedText></h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                <TranslatedText i18nKey="notifications.check_saving_goals_description">Verificação de status das metas de economia</TranslatedText>
              </p>
              
              <NotificationService 
                expenseData={expenses}
                budgetData={currentBudget}
                walletData={wallets}
                savingsData={savings}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
