import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface I18nContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  availableLanguages: { code: string; name: string; flag: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Componente que força a renderização dos filhos quando o idioma muda
 * Isso garante que todas as traduções sejam atualizadas corretamente em toda a aplicação
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  const availableLanguages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];
  
  // Atualiza o estado interno quando o idioma mudar
  useEffect(() => {
    const handleLanguageChanged = () => {
      setCurrentLanguage(i18n.language);
      
      // Também atualizamos o atributo dir e lang do HTML para controle de RTL
      const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', direction);
      document.documentElement.setAttribute('lang', i18n.language);
      
      // Disparar evento global para que outros componentes possam reagir
      window.dispatchEvent(new Event('languageChanged'));
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    // Configuração inicial
    handleLanguageChanged();
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);
  
  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  
  return (
    <I18nContext.Provider value={{ currentLanguage, setLanguage, availableLanguages }}>
      {/* Forçamos a rerenderização ao usar a chave do idioma */}
      <div key={currentLanguage}>{children}</div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}