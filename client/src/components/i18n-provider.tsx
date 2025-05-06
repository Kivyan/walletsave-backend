import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  
  // Força a renderização quando o idioma mudar
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (lng !== currentLanguage) {
        setCurrentLanguage(lng);
      }
    };
    
    // Usar o evento 'languageChanged' para detectar mudanças
    i18n.on('languageChanged', handleLanguageChanged);
    
    // Também ouvir o evento customizado criado no language-selector
    const handleGlobalLanguageChange = () => {
      if (i18n.language !== currentLanguage) {
        setCurrentLanguage(i18n.language);
      }
    };
    window.addEventListener('languageChanged', handleGlobalLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
      window.removeEventListener('languageChanged', handleGlobalLanguageChange);
    };
  }, [i18n, currentLanguage]);
  
  // O uso do key aqui força a reconstrução completa da árvore de componentes quando o idioma muda
  return <div key={currentLanguage}>{children}</div>;
}