"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Theme = "dark" | "light";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  // Verificar se já temos um tema salvo no localStorage
  const storedTheme = localStorage.getItem("theme") as Theme;
  const [theme, setTheme] = useState<Theme>(storedTheme || defaultTheme);

  // Update the theme when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    
    // Salvar o tema no localStorage para persistência
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
