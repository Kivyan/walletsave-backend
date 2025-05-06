import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { languages as availableLanguages, changeLanguage } from "@/i18n";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface Language {
  code: string;
  name: string;
  flag: string;
}

// Lista de todos os idiomas suportados
const languages: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleLanguageChange = async (languageCode: string) => {
    // Usar a função centralizada para mudar o idioma
    await changeLanguage(languageCode);
    setIsOpen(false);
    
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
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Alterar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem 
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={language.code === currentLanguage.code ? "bg-neutral-100 dark:bg-neutral-800" : ""}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
