import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "./i18n-provider";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { currentLanguage, setLanguage, availableLanguages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleLanguageChange = async (languageCode: string) => {
    setIsOpen(false);
    
    // Usar o novo contexto para mudar o idioma
    setLanguage(languageCode);
    
    // Executar um timer curto para garantir que todas as mudanças sejam aplicadas
    setTimeout(() => {
      // Também recarregar o i18n para garantir que todas as traduções sejam carregadas
      i18n.reloadResources(languageCode).then(() => {
        console.log(`Recursos de idioma ${languageCode} recarregados`);
      });
    }, 50);
    
    // Salvar a preferência de idioma no perfil do usuário se ele estiver autenticado
    if (user && user.language !== languageCode) {
      try {
        await apiRequest("PUT", "/api/user", { language: languageCode });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } catch (error) {
        console.error("Erro ao salvar preferência de idioma:", error);
      }
    }
  };
  
  // Determinar o idioma atual para destacar no menu
  const currentLang = availableLanguages.find((lang) => lang.code === currentLanguage) || availableLanguages[0];
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Alterar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((language) => (
          <DropdownMenuItem 
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={language.code === currentLang.code ? "bg-neutral-100 dark:bg-neutral-800" : ""}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
