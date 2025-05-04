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

type VerifyEmailData = {
  userId: number;
  code: string;
};

type ResendVerificationData = {
  email: string;
};

type RegisterResponse = {
  message: string;
  verificationCode: string;
  userId: number;
  email: string;
};

type VerifyEmailResponse = {
  message: string;
  user: SelectUser;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<string, Error, void>;
  registerMutation: UseMutationResult<RegisterResponse, Error, InsertUser>;
  verifyEmailMutation: UseMutationResult<VerifyEmailResponse, Error, VerifyEmailData>;
  resendVerificationMutation: UseMutationResult<RegisterResponse, Error, ResendVerificationData>;
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
      // Primeiro salvamos o idioma atual
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      
      const res = await apiRequest("POST", "/api/login", credentials);
      const userData = await res.json();
      
      // Após o login bem-sucedido, atualizamos o perfil do usuário com o idioma atual
      // apenas se o usuário não tiver uma preferência de idioma
      if (!userData.language && currentLanguage) {
        try {
          await apiRequest("PUT", "/api/user", { language: currentLanguage });
          userData.language = currentLanguage; // Atualizamos o objeto localmente para que o onSuccess use o valor correto
        } catch (error) {
          console.error("Failed to save language preference during login", error);
        }
      }
      
      return userData;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Store currency in localStorage when user logs in
      localStorage.setItem("userCurrency", user.currency || "BRL");
      
      // Aplicamos o idioma do usuário, que agora deve incluir qualquer atualização feita no mutationFn
      if (user.language) {
        i18n.changeLanguage(user.language);
        localStorage.setItem("i18nextLng", user.language);
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
      // Primeiro salvamos o idioma atual
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      
      // Incluir o idioma atual nos dados de registro, se não foi especificado
      if (!credentials.language && currentLanguage) {
        credentials.language = currentLanguage;
      }
      
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (response: RegisterResponse) => {
      toast({
        title: t("auth.register_success"),
        description: response.message || "Verifique seu email para confirmar sua conta.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.registrationFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutação para verificar o email
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailData) => {
      const res = await apiRequest("POST", "/api/verify-email", data);
      return await res.json();
    },
    onSuccess: (response: VerifyEmailResponse) => {
      queryClient.setQueryData(["/api/user"], response.user);
      toast({
        title: "Email verificado",
        description: response.message || "Seu email foi verificado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na verificação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutação para reenviar código de verificação
  const resendVerificationMutation = useMutation({
    mutationFn: async (data: ResendVerificationData) => {
      const res = await apiRequest("POST", "/api/resend-verification", data);
      return await res.json();
    },
    onSuccess: (response: RegisterResponse) => {
      toast({
        title: "Código reenviado",
        description: response.message || "Um novo código de verificação foi enviado para seu email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reenviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Salvamos o idioma atual antes de fazer logout
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      
      // Executamos o logout
      await apiRequest("POST", "/api/logout");
      
      // Registramos o idioma no localStorage para que continue após o logout
      localStorage.setItem("i18nextLng", currentLanguage);
      
      return currentLanguage;
    },
    onSuccess: (language: string) => {
      queryClient.setQueryData(["/api/user"], null);
      // Definimos a moeda padrão
      localStorage.setItem("userCurrency", "BRL");
      
      // Garantimos que o idioma seja mantido após o logout
      if (language) {
        i18n.changeLanguage(language);
      }
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
        verifyEmailMutation,
        resendVerificationMutation,
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
