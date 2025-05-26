import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/language-selector";
import { TranslatedText } from "@/components/translated-text";
import { Footer } from "@/components/footer";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faCoins, faDollarSign, faMoneyBillWave, faEye, faEyeSlash, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { EmailVerification } from "@/components/email-verification";
import { ResetPasswordDialog } from "@/components/reset-password-dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sun, Moon } from "lucide-react";

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, needsVerification, clearNeedsVerification, emailError, setEmailError } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("login");
  const [verificationData, setVerificationData] = useState<{ userId: number; email: string } | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Efeito para mostrar a verificação de email caso seja necessário
  useEffect(() => {
    if (needsVerification) {
      setVerificationData(needsVerification);
    }
  }, [needsVerification]);

  // Login form schema
  const loginSchema = z.object({
    username: z.string().min(1, t("validation.username_required") || "Email é obrigatório"),
    password: z.string().min(1, t("validation.password_required") || "Senha é obrigatória"),
  });

  // Register form schema
  const registerSchema = z.object({
    username: z.string().min(1, t("validation.username_required") || "Email é obrigatório"),
    password: z.string().min(6, t("validation.password_min_length") || "A senha deve ter pelo menos 6 caracteres"),
    fullName: z.string().min(1, t("validation.full_name_required") || "Nome completo é obrigatório"),
    confirmPassword: z.string().min(1, t("validation.confirm_password_required") || "Confirmação de senha é obrigatória"),
  }).refine(data => data.password === data.confirmPassword, {
    message: t("validation.passwords_must_match") || "As senhas não coincidem",
    path: ["confirmPassword"],
  });

  // Usamos o estado de erro de email do contexto de autenticação
  
  // Initialize forms
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      confirmPassword: "",
    },
  });

  // Form submission handlers
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values, {
      onError: (error) => {
        const errorMessage = error.message;
        
        if (errorMessage.toLowerCase().includes("email") || 
            errorMessage.toLowerCase().includes("usuário") || 
            errorMessage.toLowerCase().includes("username")) {
          loginForm.setError("username", { message: "Email ou usuário incorreto" });
        } else if (errorMessage.toLowerCase().includes("senha") || 
                   errorMessage.toLowerCase().includes("password")) {
          loginForm.setError("password", { message: "Senha incorreta" });
        } else {
          // Caso genérico, atribuir o erro ao campo de senha
          loginForm.setError("password", { message: "Credenciais inválidas" });
        }
      }
    });
  };
  
  // Limpar erro de email quando o campo muda
  useEffect(() => {
    if (emailError) {
      // Quando o usuário começa a digitar no campo de email, limpamos o erro específico
      const subscription = registerForm.watch((value, { name }) => {
        if (name === 'username' && emailError) {
          setEmailError(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [registerForm, emailError, setEmailError]);
  
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    // Limpar qualquer erro anterior
    setEmailError(null);
    
    const { confirmPassword, ...registerData } = values;
    
    // Use o idioma atual do usuário ao invés de fixar em "en"
    const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
    
    registerMutation.mutate({
      ...registerData,
      language: currentLanguage, // Usar o idioma atual
      theme: theme,
      currency: localStorage.getItem("userCurrency") || "BRL",
    }, {
      onSuccess: (data) => {
        // Quando o registro for bem-sucedido, armazenar os dados de verificação
        setVerificationData({
          userId: data.userId,
          email: data.email
        });
      },
      onError: (error) => {
        // Capturar mensagens de erro relacionadas ao email
        const errorMessage = error.message;
        
        // Verificar se a mensagem de erro está relacionada à existência de email
        if (errorMessage.toLowerCase().includes("email") || 
            errorMessage.toLowerCase().includes("não existe") ||
            errorMessage.toLowerCase().includes("inválido")) {
          
          // Definir o erro específico de email com mensagem simplificada
          setEmailError("Email inválido.");
          
          // Focar no campo de email
          setTimeout(() => {
            const emailInput = document.querySelector('input[name="username"]');
            if (emailInput) {
              (emailInput as HTMLInputElement).focus();
            }
          }, 100);
        } else if (errorMessage.toLowerCase().includes("username") ||
                   errorMessage.toLowerCase().includes("usuário")) {
          // Definir erro genérico para usuário (por ex. usuário já existe) sem usar toast
          registerForm.setError("username", { message: "Usuário já existe" });
        } else if (errorMessage.toLowerCase().includes("password") ||
                   errorMessage.toLowerCase().includes("senha")) {
          // Definir erro genérico para senha sem usar toast
          registerForm.setError("password", { message: "Senha inválida" });
        }
        // Para outros erros genéricos, não exibimos toast, apenas focamos no formulário
      }
    });
  };
  
  // Função para voltar da verificação para a tela de login
  const handleBackFromVerification = () => {
    setVerificationData(null);
    setActiveTab("login");
    // Limpar também o estado de verificação do contexto global
    if (needsVerification) {
      clearNeedsVerification();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Renderizamos o componente de verificação como um modal
  
  return (
    <div className="min-h-screen w-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center py-8">
      {verificationData && (
        <EmailVerification 
          verificationData={verificationData} 
          onBack={handleBackFromVerification} 
        />
      )}
      <ResetPasswordDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
      />
      <div className="absolute top-2 right-2 z-50 flex items-center gap-1">
        <LanguageSelector />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">{t("profile.toggle_theme")}</span>
        </Button>
      </div>
      
      <div className="auth-container w-full max-w-md mx-auto px-4 pb-4 pt-2 flex flex-col items-center justify-center relative">
        <div className="mb-3 text-center">
          <TranslatedText 
            i18nKey="app.name" 
            tag="h1"
            className="font-heading font-bold text-3xl mb-1 dark:text-accent"
            style={{ color: theme === 'dark' ? undefined : "#4B5563" }}
          >
            Wallet Save
          </TranslatedText>
          <TranslatedText 
            i18nKey="app.slogan"
            tag="p"
            className="text-sm text-neutral-600 dark:text-neutral-400"
          >
            Smart finance management
          </TranslatedText>
        </div>

              {/* Animação da carteira usando CSS puro */}
        <div className="mb-6">
          <div className="wallet-animation">
            {/* Fundo da carteira */}
            <div className="wallet-box bg-neutral-200 dark:bg-neutral-800 shadow-lg">
              <div className="wallet-icon text-secondary dark:text-accent">
                <FontAwesomeIcon icon={faWallet} />
              </div>
            </div>
            
            {/* Moedas com CSS Animation */}
            <div className="coin coin-1">
              <FontAwesomeIcon icon={faDollarSign} className="text-yellow-800 text-sm dark:text-yellow-100" />
            </div>
            
            <div className="coin coin-2">
              <FontAwesomeIcon icon={faCoins} className="text-amber-800 text-sm dark:text-amber-100" />
            </div>
            
            <div className="coin coin-3">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-orange-800 text-xs dark:text-orange-100" />
            </div>
            
            {/* Brilhos animados */}
            <div className="sparkle-effect sparkle-1"></div>
            <div className="sparkle-effect sparkle-2"></div>
            <div className="sparkle-effect sparkle-3"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-3 md:p-4 form-container w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-2 md:mb-4 p-1">
              <TabsTrigger value="login" className="py-1 md:py-2 text-xs md:text-sm">
                <TranslatedText i18nKey="auth.login">Entrar</TranslatedText>
              </TabsTrigger>
              <TabsTrigger value="register" className="py-1 md:py-2 text-xs md:text-sm">
                <TranslatedText i18nKey="auth.register">Cadastrar</TranslatedText>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-2 md:space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.username")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("auth.username_placeholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.password")}</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showLoginPassword ? "text" : "password"} 
                              placeholder="******" 
                              {...field} 
                            />
                          </FormControl>
                          <button 
                            type="button" 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-secondary focus:outline-none"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                          >
                            <FontAwesomeIcon icon={showLoginPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-1 text-right">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setResetPasswordOpen(true);
                            }}
                            className="text-sm font-medium text-primary hover:underline"
                            style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}
                          >
                            {t("auth.forgot_password")}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full mt-2 py-2"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? t("auth.logging_in") : t("auth.login")}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-1 md:space-y-3">
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.full_name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("auth.full_name_placeholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.username")}</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              placeholder={t("auth.username_placeholder")} 
                              {...field} 
                              className={emailError ? "error-highlight pr-8" : ""}
                            />
                          </FormControl>
                          {emailError && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <FormMessage>
                          {emailError && (
                            <div className="text-sm font-medium text-red-500 mt-1">
                              {emailError}
                            </div>
                          )}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.password")}</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showRegisterPassword ? "text" : "password"} 
                              placeholder="******" 
                              {...field} 
                            />
                          </FormControl>
                          <button 
                            type="button" 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-secondary focus:outline-none"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          >
                            <FontAwesomeIcon icon={showRegisterPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.confirm_password")}</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="******" 
                              {...field} 
                            />
                          </FormControl>
                          <button 
                            type="button" 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-secondary focus:outline-none"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full mt-2 py-2"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? t("auth.registering") : t("auth.register")}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-4 text-center text-xs text-neutral-800 dark:text-neutral-400" style={{ color: theme === 'dark' ? undefined : "#1f2937" }}>
          <p>
            {t("auth.terms_agreement")}{" "}
            <a href="/terms-of-service" className="font-medium hover:underline text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200">
              {t("auth.terms_of_service")}
            </a>{" "}
            {t("auth.and")}{" "}
            <a href="/privacy-policy" className="font-medium hover:underline text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200">
              {t("auth.privacy_policy")}
            </a>
            .
          </p>
          
          {/* Footer Copyright */}
          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-center text-neutral-600 dark:text-neutral-400">
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}