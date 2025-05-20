import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TranslatedTextProps {
  children?: ReactNode;
  className?: string;
  i18nKey: string;
  values?: Record<string, any>;
  tag?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

/**
 * Componente que renderiza texto traduzido e força a atualização quando o idioma muda
 */
export function TranslatedText({ 
  children, 
  className = '', 
  i18nKey,
  values,
  tag: Tag = 'span',
  style
}: TranslatedTextProps) {
  // Forçar re-renderização quando o idioma mudar
  const [componentKey, setComponentKey] = useState(Date.now());
  const { t, i18n } = useTranslation();
  const [, setLang] = useState(i18n.language);
  
  // Re-renderiza quando o idioma mudar
  useEffect(() => {
    const handleLanguageChanged = () => {
      setLang(i18n.language);
      // Força re-renderização com nova chave quando idioma muda
      setComponentKey(Date.now());
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    window.addEventListener('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
      window.removeEventListener('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);
  
  // Ajustes especiais para o idioma árabe
  const isArabic = i18n.language === 'ar';
  
  // Determinar o conteúdo a ser exibido
  let content: ReactNode;
  
  // Traduções especiais para o árabe quando necessário
  if (isArabic && i18nKey === "navigation.finance") {
    content = "المالية";
  }
  // Cabeçalho sempre em inglês, conforme solicitado
  else if (i18nKey === "app.name") {
    // Nome do aplicativo sempre em inglês, independente do idioma
    content = "Wallet Save";
  }
  // Para todas as outras chaves, tenta usar o sistema i18n normal
  else {
    const translation = t(i18nKey, values);
    
    // Se a tradução retornar a própria chave (não traduzido), use o texto filho como fallback
    if (translation === i18nKey) {
      content = children || makeReadable(i18nKey);
    } else {
      content = translation;
    }
  }
  
  // CSS condicional para idioma árabe
  const arabicClass = isArabic ? 'arabic-font ' : '';
  
  // Força re-renderização quando o idioma mudar (usando a chave)
  return (
    <Tag key={componentKey} className={`i18n-text dark:text-gray-100 ${arabicClass}${className || ''}`} style={style}>
      {content}
    </Tag>
  );
}

// Função auxiliar para transformar chaves em texto legível
function makeReadable(key: string, language?: string): string {
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Formatação padrão para palavras não traduzidas diretamente
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}