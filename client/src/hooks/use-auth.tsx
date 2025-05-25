import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import i18n, { changeLanguage } from "@/i18n";
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
      
      // Primeiro verificamos se existe um idioma armazenado no localStorage antes mesmo de verificar o usuário
      const savedLanguage = localStorage.getItem("i18nextLng");
      
      // Update language if it exists in user preferences
      if (user.language) {
        // O usuário tem um idioma configurado no perfil
        console.log("Effect detectou alteração de usuário, aplicando idioma:", user.language);
        
        // Só atualizamos o localStorage se o idioma do usuário for diferente do atual
        if (savedLanguage !== user.language) {
          localStorage.setItem("i18nextLng", user.language);
        }
        
        changeLanguage(user.language);
      } else if (savedLanguage) {
        // Se o usuário não tem idioma configurado, mas temos um no localStorage,
        // atualizamos o perfil do usuário com esse idioma
        console.log("Usuário não tem idioma, usando do localStorage:", savedLanguage);
        
        // Atualizar o perfil do usuário com o idioma do localStorage
        apiRequest("PUT", "/api/user", { language: savedLanguage })
          .then(() => {
            console.log("Perfil do usuário atualizado com idioma do localStorage");
            // Atualizar a query do usuário com o novo idioma sem buscar do servidor
            queryClient.setQueryData(["/api/user"], {
              ...user,
              language: savedLanguage
            });
          })
          .catch(error => {
            console.error("Erro ao atualizar idioma do usuário:", error);
          });
        
        // Aplicar o idioma
        changeLanguage(savedLanguage);
      } else {
        // Se nem o usuário nem localStorage têm idioma definido, usamos inglês como padrão
        const defaultLanguage = "en";
        console.log("Nenhum idioma definido, usando padrão:", defaultLanguage);
        
        // Atualizar o perfil do usuário com o idioma padrão
        apiRequest("PUT", "/api/user", { language: defaultLanguage })
          .then(() => {
            console.log("Perfil do usuário atualizado com idioma padrão");
            // Atualizar a query do usuário com o novo idioma sem buscar do servidor
            queryClient.setQueryData(["/api/user"], {
              ...user,
              language: defaultLanguage
            });
          })
          .catch(error => {
            console.error("Erro ao atualizar idioma do usuário:", error);
          });
        
        localStorage.setItem("i18nextLng", defaultLanguage);
        changeLanguage(defaultLanguage);
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
        // Após o login bem-sucedido, sempre atualizamos o perfil do usuário com o idioma atual
      // para garantir que a configuração de idioma persista
      if (currentLanguage) {
        try {
          await apiRequest("PUT", "/api/user", { language: currentLanguage });
          userData.language = currentLanguage; // Atualizamos o objeto localmente para que o onSuccess use o valor correto
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
      
      // CRÍTICO: Limpar TODOS os dados em cache para evitar vazamento de dados entre usuários
      queryClient.clear();
      
      // Agora definir os dados do novo usuário
      queryClient.setQueryData(["/api/user"], user);
      
      // Store currency in localStorage when user logs in
      localStorage.setItem("userCurrency", user.currency || "BRL");
      
      // Aplicamos o idioma do usuário, que agora deve incluir qualquer atualização feita no mutationFn
      if (user.language) {
        // Usar a função centralizada para mudar idioma
        console.log(`Aplicando idioma do usuário após login: ${user.language}`);
        changeLanguage(user.language);
      } else {
        // Se o usuário não tem idioma definido, usamos o idioma do navegador ou localStorage
        const savedLanguage = localStorage.getItem("i18nextLng");
        if (savedLanguage) {
          console.log(`Usando idioma do localStorage após login: ${savedLanguage}`);
          changeLanguage(savedLanguage);
        }
      }
      
      // Update theme if available
      if (user.theme) {
        localStorage.setItem("theme", user.theme);
      }
    },
    onError: (error: Error) => {
      // Não exibimos toasts mais - isso será tratado diretamente na interface de login
      console.error("Erro de login:", error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        // Limpar qualquer erro de email anterior
        setEmailError(null);
        
        // Primeiro salvamos o idioma atual
        const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
        
        // Garantimos que o idioma esteja sempre presente no localStorage
        localStorage.setItem("i18nextLng", currentLanguage);
        
        // Sempre incluir o idioma atual nos dados de registro para garantir persistência
        credentials.language = currentLanguage;
        console.log("Definindo idioma no registro:", currentLanguage);
        
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
        
        // Registro bem-sucedido, garantir que o idioma seja mantido
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
      // Garantir que o idioma persista após registro bem-sucedido
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      localStorage.setItem("i18nextLng", currentLanguage);
      
      toast({
        title: t("auth.register_success"),
        description: response.message || "Verifique seu email para confirmar sua conta.",
      });
    },
    onError: (error: Error) => {
      // Não mostrar toast em caso nenhum no registro - 
      // todos os erros devem ser tratados direto na interface
      // para melhor experiência do usuário
    },
  });
  
  // Mutação para verificar o email
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailData) => {
      try {
        // Primeiro salvamos o idioma atual
        const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
        localStorage.setItem("i18nextLng", currentLanguage);
        
        const res = await apiRequest("POST", "/api/verify-email", data, true);
        
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || `Erro na verificação: ${res.statusText}`);
          } catch (jsonError) {
            throw new Error(`Erro na verificação: ${res.statusText}`);
          }
        }
        
        // Verificamos se o idioma deve ser incluído na resposta
        const responseData = await res.json();
        
        // Se o usuário não tiver idioma definido, definimos o atual
        if (responseData.user && !responseData.user.language) {
          responseData.user.language = currentLanguage;
        }
        
        return responseData;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Erro ao verificar email. Tente novamente.");
      }
    },
    onSuccess: (response: VerifyEmailResponse) => {
      // Registramos o usuário no cliente
      queryClient.setQueryData(["/api/user"], response.user);
      
      // Garantimos que o idioma seja mantido
      if (response.user && response.user.language) {
        changeLanguage(response.user.language);
      } else {
        // Se o usuário não tem idioma definido, mantemos o atual
        const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
        changeLanguage(currentLanguage);
      }
      
      toast({
        title: t("auth.email_verified"),
        description: response.message || t("auth.email_verified_description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.verification_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutação para reenviar código de verificação
  const resendVerificationMutation = useMutation({
    mutationFn: async (data: ResendVerificationData) => {
      try {
        // Primeiro salvamos o idioma atual
        const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
        localStorage.setItem("i18nextLng", currentLanguage);
        
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
      // Garantimos que o idioma seja mantido
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      localStorage.setItem("i18nextLng", currentLanguage);
      changeLanguage(currentLanguage);
      
      toast({
        title: t("auth.code_resent"),
        description: response.message || t("auth.verification_code_resent"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.resend_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Salvamos o idioma atual antes de fazer logout
      const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
      console.log("Preservando idioma durante logout:", currentLanguage);
      
      // Executamos o logout
      await apiRequest("POST", "/api/logout");
      
      // Garantimos que o idioma seja explicitamente definido no localStorage antes de limpar outros dados
      localStorage.setItem("i18nextLng", currentLanguage);
      
      return currentLanguage;
    },
    onSuccess: (language: string) => {
      // Limpa os dados do usuário na cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Definimos a moeda padrão
      localStorage.setItem("userCurrency", "BRL");
      
      // Garantimos que o idioma seja mantido após o logout
      if (language) {
        console.log("Aplicando idioma após logout:", language);
        
        // Verificamos se o idioma ainda está definido no localStorage
        const storedLanguage = localStorage.getItem("i18nextLng");
        if (!storedLanguage || storedLanguage !== language) {
          localStorage.setItem("i18nextLng", language);
        }
        
        // Usar a função centralizada para mudar idioma
        changeLanguage(language);
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
