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
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex flex-col items-center justify-center w-full">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
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
      
      <div className="w-full max-w-md px-4 py-8 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-2 text-secondary dark:text-accent">Wallet Save</h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">{t("auth.slogan")}</p>
        </div>

        {/* Wallet Animation - sempre visível em qualquer tela */}
        <div className="mb-8 flex justify-center">
          <motion.div 
            className="relative w-36 h-36 sm:w-44 sm:h-44 bg-neutral-200 dark:bg-neutral-800 rounded-xl shadow-lg flex items-center justify-center overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6 
            }}
          >
            {/* Wallet - Maior contraste no dark mode */}
            <motion.div
              animate={{ rotateZ: [0, -5, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="text-secondary dark:text-accent drop-shadow-lg"
              style={{ fontSize: "calc(3rem + 1vmin)" }}
            >
              <FontAwesomeIcon icon={faWallet} className="drop-shadow-lg filter-none dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            </motion.div>
            
            {/* Animated coins */}
            <div className="absolute bottom-3 w-full flex justify-center">
              <div className="flex space-x-3">
                {/* Coin 1 */}
                <motion.div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg dark:shadow-yellow-500/30 flex items-center justify-center border-2 border-yellow-200 dark:border-yellow-400"
                  initial={{ y: 80 }}
                  animate={{ 
                    y: [0, -15, 0],
                    rotateZ: [0, 180, 360],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    delay: 0.2,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  <FontAwesomeIcon icon={faDollarSign} className="text-yellow-800 text-sm dark:text-yellow-100" />
                </motion.div>
                
                {/* Coin 2 */}
                <motion.div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg dark:shadow-amber-500/30 flex items-center justify-center border-2 border-amber-200 dark:border-amber-400"
                  initial={{ y: 80 }}
                  animate={{ 
                    y: [0, -25, 0],
                    rotateZ: [0, -180, -360],
                  }}
                  transition={{ 
                    duration: 2.3, 
                    repeat: Infinity,
                    delay: 0.5,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  <FontAwesomeIcon icon={faCoins} className="text-amber-800 text-sm dark:text-amber-100" />
                </motion.div>
                
                {/* Coin 3 */}
                <motion.div
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 shadow-lg dark:shadow-orange-500/30 flex items-center justify-center border-2 border-orange-200 dark:border-orange-400"
                  initial={{ y: 80 }}
                  animate={{ 
                    y: [0, -20, 0],
                    rotateZ: [0, 180, 360],
                  }}
                  transition={{ 
                    duration: 1.8, 
                    repeat: Infinity,
                    delay: 0.8,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  <FontAwesomeIcon icon={faMoneyBillWave} className="text-orange-800 text-xs dark:text-orange-100" />
                </motion.div>
              </div>
            </div>

            {/* Sparkle effects */}
            <motion.div 
              className="absolute top-1/4 right-1/4 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full shadow-glow dark:shadow-[0_0_5px_2px_rgba(255,255,255,0.7)]"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: 1,
                repeatType: "reverse",
              }}
            />
            <motion.div 
              className="absolute bottom-1/4 left-1/3 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full shadow-glow dark:shadow-[0_0_5px_2px_rgba(255,255,255,0.7)]"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{ 
                duration: 1.2, 
                repeat: Infinity,
                delay: 0.3,
                repeatType: "reverse",
              }}
            />
            <motion.div 
              className="absolute top-1/3 left-1/4 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-glow dark:shadow-[0_0_5px_2px_rgba(255,255,255,0.7)]"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: 0.7,
                repeatType: "reverse",
              }}
            />
          </motion.div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-5 sm:p-6 form-container w-full mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6 p-1 sm:p-1.5">
              <TabsTrigger value="login" className="py-2.5 sm:py-3 text-sm sm:text-base font-medium">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="register" className="py-2.5 sm:py-3 text-sm sm:text-base font-medium">{t("auth.register")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 sm:space-y-5">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">{t("auth.username")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("auth.username_placeholder")} className="py-2.5" {...field} />
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
                        <FormLabel className="text-sm sm:text-base">{t("auth.password")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" className="py-2.5" {...field} />
                        </FormControl>
                        <div className="mt-1 text-right">
                          <a href="#" className="text-xs sm:text-sm text-secondary dark:text-accent hover:underline">
                            {t("auth.forgot_password")}
                          </a>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full mt-4 sm:mt-5 py-2.5 sm:py-3 text-base sm:text-lg"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? t("auth.logging_in") : t("auth.login")}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 sm:space-y-5">
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">{t("auth.full_name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("auth.full_name_placeholder")} className="py-2.5" {...field} />
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
                        <FormLabel className="text-sm sm:text-base">{t("auth.username")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("auth.username_placeholder")} className="py-2.5" {...field} />
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
                        <FormLabel className="text-sm sm:text-base">{t("auth.password")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" className="py-2.5" {...field} />
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
                        <FormLabel className="text-sm sm:text-base">{t("auth.confirm_password")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" className="py-2.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full mt-4 sm:mt-5 py-2.5 sm:py-3 text-base sm:text-lg"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? t("auth.registering") : t("auth.register")}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-4 text-center text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
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