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
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface EmailVerificationProps {
  verificationData: {
    verificationCode: string;
    userId: number;
    email: string;
  },
  onBack: () => void;
}

const verificationSchema = z.object({
  code: z
    .string()
    .min(6, "O código deve ter 6 dígitos")
    .max(6, "O código deve ter 6 dígitos")
    .regex(/^\d+$/, "O código deve conter apenas números")
});

export function EmailVerification({ verificationData, onBack }: EmailVerificationProps) {
  const { t } = useTranslation();
  const { verifyEmailMutation, resendVerificationMutation } = useAuth();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(verificationSchema),
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {t("auth.verify_email") || "Verificar Email"}
          </CardTitle>
          <CardDescription>
            {t("auth.verification_code_sent") || "Um código de verificação foi enviado para"} {verificationData.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.verification_code") || "Código de Verificação"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="000000"
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
                  ? t("auth.verifying") || "Verificando..."
                  : t("auth.verify") || "Verificar"}
              </Button>
            </form>
          </Form>

          <Alert className="mt-4 bg-muted">
            <AlertDescription>
              {t("auth.check_email") || "Verifique seu email para obter o código de verificação."}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3">
          <Button
            variant="ghost"
            onClick={handleResendCode}
            disabled={resendVerificationMutation.isPending}
            className="text-sm"
          >
            {resendVerificationMutation.isPending
              ? t("auth.resending_code") || "Reenviando código..."
              : t("auth.resend_code") || "Reenviar código"}
          </Button>

          <Button
            variant="link"
            onClick={onBack}
            className="text-sm"
          >
            {t("auth.back_to_login") || "Voltar para o login"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}