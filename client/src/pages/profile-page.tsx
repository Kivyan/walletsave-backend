import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Redirect } from "wouter";
import { getInitials, SUPPORTED_CURRENCIES } from "@/lib/utils";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { languages } from "@/i18n";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { ReactElement } from "react";

export default function ProfilePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();

  // Form validation schema
  const formSchema = z.object({
    fullName: z.string().min(1, t("validation.full_name_required")),
    username: z.string().min(1, t("validation.username_required")),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    language: z.string(),
    currency: z.string(),
    theme: z.string().optional(),
  }).refine((data) => {
    // If password is provided, confirmPassword must match
    if (data.password && data.password !== data.confirmPassword) {
      return false;
    }
    return true;
  }, {
    message: t("validation.passwords_must_match"),
    path: ["confirmPassword"],
  });

  // Initialize form with user data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      username: user?.username || "",
      password: "",
      confirmPassword: "",
      language: user?.language || "en",
      currency: user?.currency || "BRL",
      theme: user?.theme || theme,
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        username: user.username,
        password: "",
        confirmPassword: "",
        language: user.language,
        currency: user.currency,
        theme: user.theme || theme,
      });
    }
  }, [user, form]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload: any = {
        fullName: data.fullName,
        language: data.language,
        currency: data.currency,
        theme: theme, // Incluir a preferência de tema atual
      };

      // Only include password if it's provided
      if (data.password) {
        payload.password = data.password;
      }

      await apiRequest("PUT", "/api/user", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t("toast.profile_updated"),
        description: t("toast.profile_updated_description"),
      });

      // Update language if changed
      if (user?.language !== form.getValues().language) {
        i18n.changeLanguage(form.getValues().language);
      }
      
      // Update currency in localStorage
      localStorage.setItem("userCurrency", form.getValues().currency);
      
      // Atualizar o tema no localStorage, se necessário
      localStorage.setItem("theme", theme);
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateProfileMutation.mutate(values);
  };

  // Handle theme toggle
  const handleThemeToggle = (value: boolean) => {
    setTheme(value ? "dark" : "light");
  };

  // Redirect if user is not logged in
  if (!user) {
    // Using a redirect component instead of just calling navigate
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-16 md:pb-0 overflow-y-auto custom-scrollbar">
      <Header title={t("profile.my_profile")} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Avatar className="w-20 h-20 bg-secondary text-white">
              <AvatarFallback className="text-2xl">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-heading">{user.fullName}</CardTitle>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {user.username}
              </p>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.edit_profile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.full_name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.username")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.new_password")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("profile.leave_blank_password")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.confirm_password")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.language")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(languages).map(([code, name]) => (
                            <SelectItem key={code} value={code}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.currency")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>{t("profile.dark_mode")}</FormLabel>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeToggle}
                  />
                </FormItem>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending
                    ? t("common.saving")
                    : t("common.save")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <MobileNavigation />
    </div>
  );
}
