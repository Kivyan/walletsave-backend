import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TranslatedTextProps {
  children: ReactNode;
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
  const { t, i18n } = useTranslation();
  const [, setLang] = useState(i18n.language);
  
  // Re-renderiza quando o idioma mudar
  useEffect(() => {
    const handleLanguageChanged = () => {
      setLang(i18n.language);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    window.addEventListener('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
      window.removeEventListener('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);
  
  // Define a direção do texto com base no idioma
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  
  // Tratamento especial para categorias e outros textos
  let content = children;
  
  if (i18nKey.includes("app.name")) {
    content = "Wallet Save";
  } else {
    // Para todas as outras chaves, usamos a tradução normal
    const translation = t(i18nKey, values);
    
    // Verifique se a tradução é igual à chave (caso em que a tradução não foi encontrada)
    // ou se contém um ponto (indicando que a chave foi retornada em vez da tradução)
    if (translation === i18nKey || translation.includes('.')) {
      // Se não há tradução adequada, use o texto filho como fallback
      content = children;
    } else {
      content = translation;
    }
  }
  
  return (
    <Tag 
      className={`i18n-text ${className || ''}`}
      style={style}
    >
      {content}
    </Tag>
  );
}