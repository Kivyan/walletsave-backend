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
    <Dialog open={true} onOpenChange={(open) => !open && onBack()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              Verificar Email
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full" 
              onClick={onBack}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Enviamos um código para {verificationData.email}
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
                  ? "Verificando..."
                  : "Confirmar"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Não recebeu o código?
            </p>
            <Button
              variant="ghost"
              onClick={handleResendCode}
              disabled={resendVerificationMutation.isPending}
              className="text-sm"
            >
              {resendVerificationMutation.isPending
                ? "Reenviando..."
                : "Enviar novamente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}