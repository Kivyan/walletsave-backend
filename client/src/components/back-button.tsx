import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className = "" }: BackButtonProps) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const handleBack = () => {
    // Verifica se há histórico de navegação para voltar
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Se não houver histórico, redireciona para a página inicial
      navigate("/");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center gap-1 ${className}`}
      onClick={handleBack}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>{t("common.back")}</span>
    </Button>
  );
}