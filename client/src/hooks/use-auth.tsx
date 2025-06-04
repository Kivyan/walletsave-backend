import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, getApiBaseUrl } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index";

const changeLanguage = (language: string) => {
  return i18n.changeLanguage(language);
};

type VerifyEmailData = { userId: number; code: string; };
type ResendVerificationData = { email: string; };
type RegisterResponse = { message: string; userId: number; email: string; };
type VerifyEmailResponse = { message: string; user: SelectUser; };
type LoginResponse = SelectUser | { needsVerification: true; message: string; userId: number; email: string; };
type LoginData = Pick<InsertUser, "username" | "password">;

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  emailError: string | null;
  needsVerification: { userId: number; email: string; } | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<string, Error, void>;
  registerMutation: UseMutationResult<RegisterResponse, Error, InsertUser>;
  verifyEmailMutation: UseMutationResult<VerifyEmailResponse, Error, VerifyEmailData>;
  resendVerificationMutation: UseMutationResult<RegisterResponse, Error, ResendVerificationData>;
  clearNeedsVerification: () => void;
  setEmailError: (error: string | null) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [needsVerification, setNeedsVerification] = useState<{ userId: number; email: string } | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Tipagem mais simples para useQuery
  const { data: user, error, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("userCurrency", user.currency || "BRL");
      const savedLanguage = localStorage.getItem("i18nextLng");

      if (user.language) {
        console.log("Effect detectou alteração de usuário, aplicando idioma:", user.language);
        if (savedLanguage !== user.language) {
          localStorage.setItem("i18nextLng", user.language);
        }
        changeLanguage(user.language);
      } else if (savedLanguage) {
        console.log("Usuário não tem idioma, usando do localStorage:", savedLanguage);
        apiRequest("PUT", "/api/user", { language: savedLanguage })
          .then(() => {
            console.log("Perfil do usuário atualizado com idioma do localStorage");
            queryClient.setQueryData(["/api/user"], { ...user, language: savedLanguage });
          })
          .catch(error => console.error("Erro ao atualizar idioma do usuário:", error));
        changeLanguage(savedLanguage);
      } else {
        const defaultLanguage = "en";
        console.log("Nenhum idioma definido, usando padrão:", defaultLanguage);
        apiRequest("PUT", "/api/user", { language: defaultLanguage })
          .then(() => {
            console.log("Perfil do usuário atualizado com idioma padrão");
            queryClient.setQueryData(["/api/user"], { ...user, language: defaultLanguage });
          })
          .catch(error => console.error("Erro ao atualizar idioma do usuário:", error));
        localStorage.setItem("i18nextLng", defaultLanguage);
        changeLanguage(defaultLanguage);
      }

      if (user.theme) {
        localStorage.setItem("theme", user.theme);
      }
    }
  }, [user]);

  const loginMutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";

      try {
        const baseURL = getApiBaseUrl();
        const res = await fetch(`${baseURL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });

        const userData = await res.json();

        if (res.status === 403 && userData.needsVerification) {
          console.log("Usuário precisa verificar email:", userData);
          setNeedsVerification({ userId: userData.userId, email: userData.email });
          return userData;
        }

        if (!res.ok) {
          throw new Error(userData.message || res.statusText);
        }

        if (currentLanguage) {
          try {
            await apiRequest("PUT", "/api/user", { language: currentLanguage });
            userData.language = currentLanguage;
            console.log("Idioma salvo durante login:", currentLanguage);
          } catch (error) {
            console.error("Failed to save language preference during login", error);
          }
        }

        return userData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (response) => {
      if ('needsVerification' in response && response.needsVerification) {
        toast({
          title: "Verificação necessária",
          description: response.message || "Por favor, verifique seu email antes de continuar",
        });
        return;
      }

      const user = response as SelectUser;
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], user);
      localStorage.setItem("userCurrency", user.currency || "BRL");

      if (user.language) {
        console.log(`Aplicando idioma do usuário após login: ${user.language}`);
        changeLanguage(user.language);
      } else {
        const savedLanguage = localStorage.getItem("i18nextLng");
        if (savedLanguage) {
          console.log(`Usando idioma do localStorage após login: ${savedLanguage}`);
          changeLanguage(savedLanguage);
        }
      }

      if (user.theme) {
        localStorage.setItem("theme", user.theme);
      }
    },
    onError: (error: Error) => {
      console.error("Erro de login:", error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        setEmailError(null);
        const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
        localStorage.setItem("i18nextLng", currentLanguage);
        credentials.language = currentLanguage;
        console.log("Definindo idioma no registro:", currentLanguage);

        const res = await apiRequest("POST", "/api/register", credentials, true) as Response;

        if (!res.ok) {
          try {
            const errorData = await res.json();
            const errorMessage = errorData.message || `Erro no registro: ${res.statusText}`;
            const isEmailError = errorMessage.toLowerCase().includes('email') ||
              errorMessage.toLowerCase().includes('formato') ||
              errorMessage.toLowerCase().includes('existe') ||
              errorMessage.toLowerCase().includes('válido') ||
              errorMessage.toLowerCase().includes('verificação');

            if (isEmailError) {
              setEmailError("Email inválido.");
            }
            throw new Error(errorMessage);
          } catch (jsonError) {
            throw new Error(`Erro no registro: ${res.statusText}`);
          }
        }

        changeLanguage(currentLanguage);
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Erro ao criar conta. Tente novamente.");
      }
    },
    onSuccess: (response: RegisterResponse) => {
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      localStorage.setItem("i18nextLng", currentLanguage);
      toast({
        title: t("auth.register_success"),
        description: response.message || "Verifique seu email para confirmar sua conta.",
      });
    },
    onError: (error: Error) => {
      console.error("Erro no registro:", error.message);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailData) => {
      try {
        const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
        localStorage.setItem("i18nextLng", currentLanguage);
        const response = await apiRequest("POST", "/api/verify-email", data);
        changeLanguage(currentLanguage);
        return response;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Erro ao verificar email. Tente novamente.");
      }
    },
    onSuccess: (response: VerifyEmailResponse) => {
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      localStorage.setItem("i18nextLng", currentLanguage);
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], response.user);
      setNeedsVerification(null);
      localStorage.setItem("userCurrency", response.user.currency || "BRL");

      if (response.user.language) {
        changeLanguage(response.user.language);
      } else {
        changeLanguage(currentLanguage);
      }

      if (response.user.theme) {
        localStorage.setItem("theme", response.user.theme);
      }

      toast({
        title: t("auth.email_verified"),
        description: response.message || "Email verificado com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("Erro na verificação:", error.message);
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (data: ResendVerificationData) => {
      return await apiRequest("POST", "/api/resend-verification", data);
    },
    onSuccess: (response: RegisterResponse) => {
      toast({
        title: t("auth.verification_resent"),
        description: response.message || "Código de verificação reenviado!",
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao reenviar verificação:", error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      return response.message || "Logout realizado com sucesso";
    },
    onSuccess: () => {
      queryClient.clear();
      setNeedsVerification(null);
      setEmailError(null);
      toast({
        title: t("auth.logout_success"),
        description: "Você foi desconectado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error("Erro no logout:", error.message);
    },
  });

  const clearNeedsVerification = () => {
    setNeedsVerification(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        emailError,
        needsVerification,
        loginMutation,
        logoutMutation,
        registerMutation,
        verifyEmailMutation,
        resendVerificationMutation,
        clearNeedsVerification,
        setEmailError,
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