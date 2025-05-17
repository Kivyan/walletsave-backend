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
  
  if (i18nKey === "app.name") {
    content = "Wallet Save";
  } else {
    // Para todas as outras chaves, usamos a tradução normal
    const translation = t(i18nKey, values);
    
    // Verificações para evitar exibição de chaves de tradução ou textos com formato ruim
    if (translation === i18nKey) {
      // Se não há tradução adequada, use o texto filho como fallback
      content = children;
    } else if (translation.includes('.') && !translation.includes(' ')) {
      // Se contém um ponto e não tem espaços, provavelmente é uma chave de tradução não traduzida
      // Tenta extrair a última parte da chave (após o último ponto) e apresentar de forma mais amigável
      const parts = translation.split('.');
      const lastPart = parts[parts.length - 1];
      
      // Converte de camelCase ou snake_case para formato normal
      const readable = lastPart
        .replace(/([A-Z])/g, ' $1') // camelCase para espaços
        .replace(/_/g, ' ')         // snake_case para espaços
        .toLowerCase()
        .trim()
        .replace(/^\w/, c => c.toUpperCase()); // Primeira letra maiúscula
      
      content = readable;
      
      // Log para debug - ajuda a identificar traduções faltantes
      console.log(`Translation missing or incomplete: ${i18nKey} → ${readable}`);
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