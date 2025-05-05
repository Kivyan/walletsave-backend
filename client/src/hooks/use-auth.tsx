import { createContext, ReactNode, useContext, useEffect, useState } from "react";
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
  userId: number;
  email: string;
};

type VerifyEmailResponse = {
  message: string;
  user: SelectUser;
};

type LoginResponse = SelectUser | {
  needsVerification: true;
  message: string;
  userId: number;
  email: string;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  emailError: string | null; // Adicionado para erros específicos de email
  needsVerification: {
    userId: number;
    email: string;
  } | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<string, Error, void>;
  registerMutation: UseMutationResult<RegisterResponse, Error, InsertUser>;
  verifyEmailMutation: UseMutationResult<VerifyEmailResponse, Error, VerifyEmailData>;
  resendVerificationMutation: UseMutationResult<RegisterResponse, Error, ResendVerificationData>;
  clearNeedsVerification: () => void;
  setEmailError: (error: string | null) => void; // Função para definir o erro de email
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [needsVerification, setNeedsVerification] = useState<{ userId: number; email: string } | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null); // Estado para armazenar erros de email específicos
  
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

  const loginMutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      // Primeiro salvamos o idioma atual
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      
      try {
        // Usar fetch diretamente ao invés de apiRequest para capturar o status 403
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        const userData = await res.json();
        
        // Se o status for 403, significa que o usuário não está verificado
        if (res.status === 403 && userData.needsVerification) {
          console.log("Usuário precisa verificar email:", userData);
          // Define o estado que irá acionar a exibição do modal de verificação
          setNeedsVerification({
            userId: userData.userId,
            email: userData.email
          });
          return userData; // Retorna o objeto com informações de verificação
        }
        
        // Se a resposta não for 200 OK e não for o caso especial de verificação,
        // lançamos um erro
        if (!res.ok) {
          throw new Error(userData.message || res.statusText);
        }
        
        // Continua com o processo normal para login bem-sucedido
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
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (response) => {
      // Se a resposta indica que o email precisa ser verificado
      if ('needsVerification' in response && response.needsVerification) {
        // Não atualiza o usuário, apenas exibe a mensagem
        toast({
          title: "Verificação necessária",
          description: response.message || "Por favor, verifique seu email antes de continuar",
        });
        return;
      }
      
      // Para respostas de login bem-sucedidas
      const user = response as SelectUser;
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
      try {
        // Limpar qualquer erro de email anterior
        setEmailError(null);
        
        // Primeiro salvamos o idioma atual
        const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
        
        // Incluir o idioma atual nos dados de registro, se não foi especificado
        if (!credentials.language && currentLanguage) {
          credentials.language = currentLanguage;
        }
        
        const res = await apiRequest("POST", "/api/register", credentials, true); // Skip auto error check
        
        if (!res.ok) {
          // Processar respostas de erro
          try {
            const errorData = await res.json();
            
            // Verificamos especificamente se o erro está relacionado ao email
            const errorMessage = errorData.message || `Erro no registro: ${res.statusText}`;
            const isEmailError = errorMessage.toLowerCase().includes('email') || 
                                errorMessage.toLowerCase().includes('formato') ||
                                errorMessage.toLowerCase().includes('existe') ||
                                errorMessage.toLowerCase().includes('válido') ||
                                errorMessage.toLowerCase().includes('verificação');
                               
            // Se for um erro de email, atualiza o estado específico para isso
            if (isEmailError) {
              // Simplificamos a mensagem de erro para "Email inválido."
              setEmailError("Email inválido.");
            }
                               
            throw new Error(errorMessage);
          } catch (jsonError) {
            // Se não for JSON válido
            throw new Error(`Erro no registro: ${res.statusText}`); 
          }
        }
        
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error; 
        }
        throw new Error("Erro ao criar conta. Tente novamente.");
      }
    },
    onSuccess: (response: RegisterResponse) => {
      toast({
        title: t("auth.register_success"),
        description: response.message || "Verifique seu email para confirmar sua conta.",
      });
    },
    onError: (error: Error) => {
      // Não mostrar toast se for um erro de email (já tratado na interface)
      if (!emailError) {
        toast({
          title: t("toast.registrationFailed"),
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });
  
  // Mutação para verificar o email
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailData) => {
      try {
        const res = await apiRequest("POST", "/api/verify-email", data, true);
        
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || `Erro na verificação: ${res.statusText}`);
          } catch (jsonError) {
            throw new Error(`Erro na verificação: ${res.statusText}`);
          }
        }
        
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Erro ao verificar email. Tente novamente.");
      }
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
      try {
        const res = await apiRequest("POST", "/api/resend-verification", data, true);
        
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || `Erro ao reenviar código: ${res.statusText}`);
          } catch (jsonError) {
            throw new Error(`Erro ao reenviar código: ${res.statusText}`);
          }
        }
        
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Erro ao reenviar código de verificação. Tente novamente.");
      }
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

  // Função para limpar o estado de verificação quando o usuário fechar o modal
  const clearNeedsVerification = () => {
    setNeedsVerification(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        emailError,
        needsVerification,
        clearNeedsVerification,
        setEmailError,
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
