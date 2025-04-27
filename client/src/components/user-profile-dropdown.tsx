import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { getInitials } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { 
  User, 
  Settings, 
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

export function UserProfileDropdown() {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    setIsOpen(false);
    logoutMutation.mutate();
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate("/profile");
  };

  const toggleTheme = () => {
    setIsOpen(false);
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-medium text-sm">
        {getInitials(user.fullName)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          {t("profile.my_profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "light" ? (
            <>
              <Moon className="mr-2 h-4 w-4" />
              {t("profile.dark_mode")}
            </>
          ) : (
            <>
              <Sun className="mr-2 h-4 w-4" />
              {t("profile.light_mode")}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="text-red-500 focus:text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logoutMutation.isPending ? t("profile.logging_out") : t("profile.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
