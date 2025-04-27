import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Effect to update currency, language, and theme preferences
  useEffect(() => {
    if (user) {
      // Store currency in localStorage
      localStorage.setItem("userCurrency", user.currency || "BRL");
      
      // Update language if it exists in user preferences
      if (user.language) {
        i18n.changeLanguage(user.language);
      }
      
      // Update theme if it exists in user preferences
      if (user.theme) {
        localStorage.setItem("theme", user.theme);
      }
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Store currency in localStorage when user logs in
      localStorage.setItem("userCurrency", user.currency || "BRL");
      
      // Verificamos se o usuário tem uma preferência de idioma
      // Se não tiver, usamos o idioma salvo no localStorage
      if (user.language) {
        i18n.changeLanguage(user.language);
      } else {
        // Se o usuário não tiver uma preferência de idioma no perfil,
        // mas tiver um idioma no localStorage, usamos e salvamos no perfil
        const storedLang = localStorage.getItem("i18nextLng");
        if (storedLang) {
          // Atualizamos o perfil do usuário com o idioma do localStorage
          try {
            apiRequest("PUT", "/api/user", { language: storedLang });
            // Não precisamos recarregar os dados do usuário aqui
          } catch (error) {
            console.error("Failed to save language preference", error);
          }
        }
      }
      
      // Update theme if available
      if (user.theme) {
        localStorage.setItem("theme", user.theme);
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Store currency in localStorage when user registers
      localStorage.setItem("userCurrency", user.currency || "BRL");
      
      // Verificamos se o usuário tem uma preferência de idioma
      // Se não tiver, usamos o idioma salvo no localStorage
      if (user.language) {
        i18n.changeLanguage(user.language);
      } else {
        // Se o usuário não tiver uma preferência de idioma no perfil,
        // mas tiver um idioma no localStorage, usamos e salvamos no perfil
        const storedLang = localStorage.getItem("i18nextLng");
        if (storedLang) {
          // Atualizamos o perfil do usuário com o idioma do localStorage
          try {
            apiRequest("PUT", "/api/user", { language: storedLang });
            // Não precisamos recarregar os dados do usuário aqui
          } catch (error) {
            console.error("Failed to save language preference", error);
          }
        }
      }
      
      // Update theme if available
      if (user.theme) {
        localStorage.setItem("theme", user.theme);
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.registrationFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      // Reset to default currency on logout
      localStorage.setItem("userCurrency", "BRL");
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.logoutFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
