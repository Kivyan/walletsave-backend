import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/language-selector";
import { useTheme } from "@/components/theme-provider";

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
  const { t } = useTranslation();
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
    registerMutation.mutate({
      ...registerData,
      language: "en",
      theme: theme,
      currency: "BRL",
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-100 dark:bg-neutral-900">
      <div className="absolute top-4 right-4 flex items-center gap-2">
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

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading font-bold text-3xl mb-2 text-secondary dark:text-accent">FinTrack</h1>
          <p className="text-neutral-600 dark:text-neutral-400">{t("auth.slogan")}</p>
        </div>

        {/* Wallet Animation */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-48 h-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
            <i className="fas fa-wallet text-6xl text-secondary dark:text-accent"></i>
            {/* Animated coins */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                <div className="w-8 h-8 rounded-full bg-yellow-400 shadow-md flex items-center justify-center">
                  <span className="text-yellow-800 text-xs font-bold">$</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-yellow-500 shadow-md flex items-center justify-center">
                  <span className="text-yellow-800 text-xs font-bold">$</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-yellow-300 shadow-md flex items-center justify-center">
                  <span className="text-yellow-800 text-xs font-bold">$</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
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
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? t("auth.logging_in") : t("auth.login")}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
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
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? t("auth.registering") : t("auth.register")}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>
            {t("auth.terms_agreement")}{" "}
            <a href="#" className="text-secondary dark:text-accent hover:underline">
              {t("auth.terms_of_service")}
            </a>{" "}
            {t("auth.and")}{" "}
            <a href="#" className="text-secondary dark:text-accent hover:underline">
              {t("auth.privacy_policy")}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
