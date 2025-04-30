import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/language-selector";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import { AutoScaleContainer } from "@/components/auto-scale-container";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faCoins, faDollarSign, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";

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
  const { user, loginMutation, registerMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form schema
  const loginSchema = z.object({
    username: z.string().min(1, t("validation.username_required")),
    password: z.string().min(1, t("validation.password_required")),
  });

  // Register form schema
  const registerSchema = z.object({
    username: z.string().min(1, t("validation.username_required")),
    password: z.string().min(6, t("validation.password_min_length")),
    fullName: z.string().min(1, t("validation.full_name_required")),
    confirmPassword: z.string().min(1, t("validation.confirm_password_required")),
  }).refine(data => data.password === data.confirmPassword, {
    message: t("validation.passwords_must_match"),
    path: ["confirmPassword"],
  });

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
    loginMutation.mutate(values);
  };
  
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = values;
    
    // Use o idioma atual do usuário ao invés de fixar em "en"
    const currentLanguage = i18n.language || localStorage.getItem("i18nextLng") || "en";
    
    registerMutation.mutate({
      ...registerData,
      language: currentLanguage, // Usar o idioma atual
      theme: theme,
      currency: localStorage.getItem("userCurrency") || "BRL",
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="min-h-screen w-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center py-8">
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
          <h1 className="font-heading font-bold text-2xl mb-1 text-secondary dark:text-accent">Wallet Save</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("auth.slogan")}</p>
        </div>

        {/* Logo na tela de login */}
        <div className="mb-8 flex flex-col items-center justify-center">
          <div className="w-[190px] h-[190px] relative">
            {/* Fundo com gradiente */}
            <div className="absolute w-36 h-36 bg-gradient-to-b from-yellow-500/10 to-amber-500/5 dark:from-yellow-500/20 dark:to-amber-600/10 rounded-full blur-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Carteira principal */}
            <div className="absolute w-[160px] h-[160px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-xl shadow-lg flex items-center justify-center z-10">
              <motion.div
                className="text-secondary dark:text-accent"
                style={{ fontSize: "5rem" }}
                animate={{ rotateZ: [0, -5, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              >
                <FontAwesomeIcon icon={faWallet} className="drop-shadow-lg filter-none dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
              </motion.div>
            </div>
            
            {/* Moedas estáticas (sem animação) */}
            <div className="absolute flex justify-center w-full bottom-0 z-20">
              <div className="w-10 h-10 mx-1 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg border-2 border-yellow-200 dark:border-yellow-400 flex items-center justify-center">
                <FontAwesomeIcon icon={faDollarSign} className="text-yellow-800 text-sm dark:text-yellow-100" />
              </div>
              
              <div className="w-11 h-11 mx-1 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg border-2 border-amber-200 dark:border-amber-400 flex items-center justify-center">
                <FontAwesomeIcon icon={faCoins} className="text-amber-800 text-sm dark:text-amber-100" />
              </div>
              
              <div className="w-10 h-10 mx-1 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 shadow-lg border-2 border-orange-200 dark:border-orange-400 flex items-center justify-center">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-orange-800 text-xs dark:text-orange-100" />
              </div>
            </div>
            
            {/* Brilhos estáticos */}
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-60 shadow-sm top-1/3 right-1/4"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-60 shadow-sm bottom-1/3 left-1/4"></div>
          </div>
          
          <h2 className="mt-2 text-lg font-semibold text-secondary dark:text-accent">Wallet Save</h2>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-3 md:p-4 form-container w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-2 md:mb-4 p-1">
              <TabsTrigger value="login" className="py-1 md:py-2 text-xs md:text-sm">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="register" className="py-1 md:py-2 text-xs md:text-sm">{t("auth.register")}</TabsTrigger>
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
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <div className="mt-1 text-right">
                          <a href="#" className="text-xs text-secondary dark:text-accent hover:underline">
                            {t("auth.forgot_password")}
                          </a>
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
                        <FormControl>
                          <Input placeholder={t("auth.username_placeholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.password")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
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

        <div className="mt-4 text-center text-xs text-neutral-600 dark:text-neutral-400">
          <p>
            {t("auth.terms_agreement")}{" "}
            <a href="/terms-of-service" className="text-secondary dark:text-accent hover:underline">
              {t("auth.terms_of_service")}
            </a>{" "}
            {t("auth.and")}{" "}
            <a href="/privacy-policy" className="text-secondary dark:text-accent hover:underline">
              {t("auth.privacy_policy")}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}