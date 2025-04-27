import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NavigationButtons() {
  const [location, navigate] = useLocation();
  const { t } = useTranslation();

  // A lista ordenada de rotas para navegação sequencial
  const routes = [
    "/",
    "/wallet",
    "/reports",
    "/savings",
    "/profile",
  ];

  const currentIndex = routes.indexOf(location);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < routes.length - 1 && currentIndex !== -1;

  const handleBack = () => {
    if (hasPrevious) {
      navigate(routes[currentIndex - 1]);
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handleNext = () => {
    if (hasNext) {
      navigate(routes[currentIndex + 1]);
    }
  };

  if (location === "/auth") {
    return null; // Não mostrar na página de autenticação
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 flex gap-2 z-10">
      {hasPrevious && (
        <Button 
          variant="secondary" 
          size="sm" 
          className="rounded-full w-10 h-10 p-0 shadow-md flex items-center justify-center"
          onClick={handleBack}
          title={t("common.back")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      {hasNext && (
        <Button 
          variant="secondary" 
          size="sm" 
          className="rounded-full w-10 h-10 p-0 shadow-md flex items-center justify-center"
          onClick={handleNext}
          title={t("common.next")}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}