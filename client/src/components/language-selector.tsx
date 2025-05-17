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
    
    console.log(`Definindo idioma no registro:`, languageCode);
    
    // Salvar no localStorage primeiro para garantir persistência
    localStorage.setItem("i18nextLng", languageCode);
    
    // Mudar o idioma diretamente via i18n para garantir que seja aplicado imediatamente
    await i18n.changeLanguage(languageCode);
    
    // Usar o novo contexto para manter estado consistente
    setLanguage(languageCode);
    
    // Forçar recarga de recursos
    try {
      await i18n.reloadResources();
      
      // Disparar evento manual para garantir que componentes reajam à mudança
      window.dispatchEvent(new Event('languageChanged'));
      
      console.log(`Idioma alterado com sucesso para: ${languageCode}`);
    } catch (error) {
      console.error("Erro ao recarregar recursos de idioma:", error);
    }
    
    // Salvar a preferência de idioma no perfil do usuário se ele estiver autenticado
    if (user) {
      try {
        console.log(`Salvando preferência de idioma ${languageCode} no perfil do usuário ${user.id}`);
        await apiRequest("PUT", "/api/user", { language: languageCode });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } catch (error) {
        console.error("Erro ao salvar preferência de idioma:", error);
      }
    } else {
      console.log("Usuário não está logado, idioma salvo apenas no localStorage");
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
