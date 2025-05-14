import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TranslatedText } from "@/components/translated-text";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ open, onOpenChange }: ResetPasswordDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [resetSent, setResetSent] = useState(false);

  // Schema de validação para o formulário
  const resetSchema = z.object({
    email: z.string().email(t("validation.invalid_email"))
  });

  // Inicializar o formulário
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: ""
    }
  });

  // Mutation para enviar solicitação de redefinição de senha
  const resetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resetSchema>) => {
      const res = await apiRequest("POST", "/api/reset-password-request", data);
      return await res.json();
    },
    onSuccess: () => {
      setResetSent(true);
      toast({
        title: t("auth.reset_link_sent_title"),
        description: t("auth.reset_link_sent_description"),
      });
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
    resetMutation.mutate(data);
  };

  // Fechar e redefinir o estado ao fechar o diálogo
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setResetSent(false);
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t("auth.reset_password") || "Recuperar Senha"}
          </DialogTitle>
          <DialogDescription>
            {t("auth.reset_password_description") || "Digite seu email para receber um link de recuperação de senha."}
          </DialogDescription>
        </DialogHeader>
        
        {resetSent ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-4 text-center text-secondary-foreground">
              {t("auth.check_email_for_reset") || "Verifique seu email para redefinir sua senha."}
            </div>
            <Button 
              onClick={() => handleOpenChange(false)}
              className="w-full"
            >
              {t("common.close") || "Fechar"}
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.username") || "Email"}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("auth.username_placeholder") || "seu@email.com"} 
                        type="email"
                        autoComplete="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                  disabled={resetMutation.isPending}
                >
                  {t("common.cancel") || "Cancelar"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.sending") || "Enviando..."}
                    </>
                  ) : (
                    t("auth.send_reset_link") || "Enviar Link"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}