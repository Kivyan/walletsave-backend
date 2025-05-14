import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface EmailVerificationProps {
  verificationData: {
    userId: number;
    email: string;
  },
  onBack: () => void;
}

// Função que retorna o schema com traduções
function getVerificationSchema(t: (key: string) => string) {
  return z.object({
    code: z
      .string()
      .min(6, t("validation.code_six_digits") || "O código deve ter 6 dígitos")
      .max(6, t("validation.code_six_digits") || "O código deve ter 6 dígitos")
      .regex(/^\d+$/, t("validation.code_numbers_only") || "O código deve conter apenas números")
  });
}

export function EmailVerification({ verificationData, onBack }: EmailVerificationProps) {
  const { t } = useTranslation();
  const { verifyEmailMutation, resendVerificationMutation } = useAuth();
  const { toast } = useToast();
  
  // Usar o schema com as traduções atualizadas
  const form = useForm({
    resolver: zodResolver(getVerificationSchema(t)),
    defaultValues: {
      code: ""
    }
  });

  // Função para verificar o email
  const onSubmit = (data: { code: string }) => {
    verifyEmailMutation.mutate({
      userId: verificationData.userId,
      code: data.code
    });
  };

  // Função para reenviar o código
  const handleResendCode = () => {
    resendVerificationMutation.mutate({
      email: verificationData.email
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onBack()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              {t("auth.confirm_email") || "Confirmar Email"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t("auth.code_sent_to") || "Enviamos um código de verificação para"} {verificationData.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="text-center">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("auth.verification_code_placeholder") || "000000"}
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={verifyEmailMutation.isPending}
              >
                {verifyEmailMutation.isPending 
                  ? (t("auth.checking") || "Verificando...")
                  : (t("auth.confirm") || "Confirmar")}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("auth.no_code") || "Não recebeu o código?"}
            </p>
            <Button
              variant="ghost"
              onClick={handleResendCode}
              disabled={resendVerificationMutation.isPending}
              className="text-sm"
            >
              {resendVerificationMutation.isPending
                ? (t("auth.sending") || "Enviando...")
                : (t("auth.send_again") || "Enviar novamente")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}