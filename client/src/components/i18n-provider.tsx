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
      
      // Sempre manter a direção como LTR, independente do idioma
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', i18n.language);
      
      // Mensagens de mudança de idioma no idioma correto
      const languageMessages = {
        'pt': `Idioma alterado para: ${i18n.language}, mantendo direção: ltr`,
        'en': `Language changed to: ${i18n.language}, maintaining direction: ltr`,
        'es': `Idioma cambiado a: ${i18n.language}, manteniendo dirección: ltr`,
        'fr': `Langue changée vers: ${i18n.language}, maintien de la direction: ltr`,
        'de': `Sprache geändert zu: ${i18n.language}, Richtung beibehalten: ltr`,
        'it': `Lingua cambiata in: ${i18n.language}, mantenendo direzione: ltr`,
        'ja': `言語が変更されました: ${i18n.language}、方向を維持: ltr`,
        'zh': `语言已更改为: ${i18n.language}，保持方向: ltr`,
        'ru': `Язык изменен на: ${i18n.language}, сохранение направления: ltr`,
        'ar': `تم تغيير اللغة إلى: ${i18n.language}، الاحتفاظ بالاتجاه: ltr`
      };
      
      // Log na língua correta
      console.log(languageMessages[i18n.language] || languageMessages['en']);
      
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
  
  const setLanguage = async (lang: string) => {
    // Primeiro salvamos no localStorage para garantir persistência
    localStorage.setItem("i18nextLng", lang);
    console.log("I18nProvider.setLanguage: Idioma salvo no localStorage:", lang);
    
    // Mudamos o idioma no i18next e esperamos a conclusão
    await i18n.changeLanguage(lang);
    
    // Recarregar os recursos do idioma selecionado
    await i18n.reloadResources(lang);
    
    // Forçar atualização em todo o app
    setCurrentLanguage(lang);
    
    // Disparar evento global
    window.dispatchEvent(new Event('languageChanged'));
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