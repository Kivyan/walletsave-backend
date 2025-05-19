import { useTranslation } from "react-i18next";
import { UserProfileDropdown } from "@/components/user-profile-dropdown";
import { NotificationsDropdown } from "@/components/notifications-dropdown-new";
import { Moon, Sun, ChevronLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <header className="bg-white dark:bg-neutral-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left section with back button and user profile */}
          <div className="flex items-center space-x-2 z-20">
            {/* Botão de voltar - somente em páginas que não são a home */}
            {location !== "/" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-1 sm:mr-2 flex items-center p-1 sm:p-2"
                aria-label={t("common.back")}
              >
                <ChevronLeft className="h-4 w-4 mr-0 sm:mr-1" />
                <span className="hidden sm:inline text-sm">{t("common.back")}</span>
              </Button>
            )}
            
            {/* User profile icon */}
            <div className="relative">
              <UserProfileDropdown />
            </div>
          </div>

          {/* Nome centralizado do app - sempre "Wallet Save" em todas as páginas */}
          <div 
            className="cursor-pointer absolute left-0 right-0 mx-auto flex justify-center"
            style={{ width: 'fit-content' }}
            onClick={() => window.location.href = '/'}
          >
            <h1 className="text-lg md:text-xl font-heading font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors whitespace-nowrap">
              Wallet Save
            </h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 z-20">
            {/* Toggle dark mode */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-neutral-500 dark:text-neutral-300"
              aria-label={t("profile.toggle_theme")}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Notifications */}
            <NotificationsDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
