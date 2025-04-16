import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import { Home, Wallet, PieChart, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const { t } = useTranslation();
  const [location] = useLocation();

  const navItems = [
    {
      href: "/",
      label: t("navigation.home"),
      icon: Home,
    },
    {
      href: "/wallet",
      label: t("navigation.wallet"),
      icon: Wallet,
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 shadow-lg md:hidden z-10">
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
      </div>
    </nav>
  );
}
