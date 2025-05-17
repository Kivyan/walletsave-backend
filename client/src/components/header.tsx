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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section with back button and user profile */}
          <div className="flex items-center space-x-2">
            {/* Botão de voltar - somente em páginas que não são a home */}
            {location !== "/" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 flex items-center"
                aria-label={t("common.back")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("common.back")}</span>
              </Button>
            )}
            
            {/* User profile icon */}
            <div className="relative">
              <UserProfileDropdown />
            </div>
          </div>

          {/* Page title with app name as home button - just text */}
          <div 
            className="cursor-pointer" 
            onClick={() => window.location.href = '/'}
          >
            <h1 className="text-2xl font-heading font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Wallet Save
              {title !== "Home" && <span className="text-sm ml-2 text-gray-600 dark:text-gray-400 font-normal">| {title}</span>}
            </h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-4">
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
