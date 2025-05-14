import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TranslatedText } from "@/components/translated-text";
import { useLocation, useRoute, useRouter } from "wouter";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, EyeIcon, EyeOffIcon } from "lucide-react";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/reset-password");
  const [match, routeParams] = useRoute("/reset-password/:token");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Schema de validação para o formulário
  const resetSchema = z.object({
    password: z.string().min(6, t("validation.password_length")),
    confirmPassword: z.string().min(6, t("validation.password_length")),
  }).refine(data => data.password === data.confirmPassword, {
    message: t("validation.passwords_must_match"),
    path: ["confirmPassword"],
  });

  // Inicializar o formulário
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    // Obter o token da URL
    const tokenFromRoute = match ? routeParams.token : new URLSearchParams(window.location.search).get("token");
    
    if (!tokenFromRoute) {
      setIsLoading(false);
      setIsValidToken(false);
      return;
    }

    setToken(tokenFromRoute);

    // Verificar se o token é válido
    const verifyToken = async () => {
      try {
        const res = await apiRequest("GET", `/api/reset-password/${tokenFromRoute}`);
        const data = await res.json();
        
        if (res.ok) {
          setIsValidToken(true);
          setUserId(data.userId);
        } else {
          setIsValidToken(false);
          toast({
            title: t("toast.error"),
            description: data.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        setIsValidToken(false);
        toast({
          title: t("toast.error"),
          description: t("auth.invalid_reset_token"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [match, routeParams, toast, t]);

  // Mutation para redefinir a senha
  const resetMutation = useMutation({
    mutationFn: async (data: { token: string, password: string }) => {
      const res = await apiRequest("POST", "/api/reset-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("auth.password_reset_success_title") || "Senha atualizada com sucesso!",
        description: t("auth.password_reset_success_description") || "Sua senha foi redefinida. Você já pode fazer login com sua nova senha.",
      });
      // Redirecionar para página de login após um breve intervalo
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Função para lidar com o envio do formulário
  const onSubmit = (data: z.infer<typeof resetSchema>) => {
    if (!token) return;
    
    resetMutation.mutate({
      token,
      password: data.password
    });
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verificação de ambiente de desenvolvimento (Replit)
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('replit.dev');
  
  // Renderizar erro de token inválido
  if (isValidToken === false) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {t("auth.invalid_token_title") || "Link Inválido"}
            </CardTitle>
            <CardDescription>
              {t("auth.invalid_token_description") || "Este link de recuperação de senha é inválido ou expirou."}
            </CardDescription>
            
            {isDevelopment && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-sm">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                  {t("auth.dev_mode") || "Modo de Desenvolvimento"}
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-2">
                  {t("auth.reset_link_dev_warning") || "Links de redefinição de senha nos emails não funcionam diretamente no ambiente de desenvolvimento."}
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  <strong>{t("auth.how_to_test") || "Como testar"}:</strong> {t("auth.copy_token_instruction") || "Copie apenas o token do email (após \"token=\" na URL) e cole-o manualmente abaixo:"}
                </p>
                <div className="mt-2">
                  <Input 
                    placeholder={t("auth.paste_token_here") || "Cole o token aqui"} 
                    className="mt-1"
                    onChange={(e) => {
                      if (e.target.value) {
                        window.location.href = `/reset-password?token=${e.target.value}`;
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate("/auth")}
            >
              {t("auth.back_to_login") || "Voltar para o Login"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Renderizar formulário de redefinição de senha
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {t("auth.reset_password") || "Criar Nova Senha"}
          </CardTitle>
          <CardDescription>
            {t("auth.reset_password_page_description") || "Digite e confirme sua nova senha."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("auth.new_password") || "Nova Senha"}
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("auth.confirm_password") || "Confirmar Senha"}
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.updating") || "Atualizando..."}
                  </>
                ) : (
                  <>{t("auth.update_password") || "Atualizar Senha"}</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => navigate("/auth")}
          >
            {t("auth.back_to_login") || "Voltar para o Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}