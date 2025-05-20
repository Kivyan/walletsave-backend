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
  // Traduções do nome do aplicativo conforme o idioma
  else if (i18nKey === "app.name") {
    // Traduções específicas para cada idioma
    const appNameTranslations: Record<string, string> = {
      'en': 'Wallet Save',
      'pt': 'Salvar Carteira',
      'es': 'Ahorro de Cartera', 
      'fr': 'Économie de Portefeuille',
      'de': 'Brieftasche Sparen',
      'it': 'Risparmio Portafoglio',
      'ru': 'Экономия Кошелька',
      'zh': '钱包储蓄',
      'ja': 'ウォレット節約', 
      'ar': 'حفظ المحفظة'
    };
    
    // Usa a tradução específica ou volta para "Wallet Save" se não houver
    content = appNameTranslations[i18n.language] || "Wallet Save";
  }
  // Para todas as outras chaves, tenta usar o sistema i18n normal
  else {
    const translation = t(i18nKey, values);
    
    // Se a tradução retornar a própria chave (não traduzido), use o texto filho como fallback
    if (translation === i18nKey) {
      content = children || makeReadable(i18nKey, i18n.language);
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
  // Definir linguagem padrão como inglês se não for fornecida
  const currentLanguage = language || 'en';
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Dicionário de palavras comuns para tradução direta
  const commonWords: Record<string, Record<string, string>> = {
    'wallet': {
      'ar': 'محفظة',   // árabe
      'pt': 'Carteira', // português
      'es': 'Cartera',  // espanhol
      'fr': 'Portefeuille', // francês
      'de': 'Brieftasche', // alemão
      'it': 'Portafoglio', // italiano
      'ru': 'Кошелек',   // russo
      'zh': '钱包',      // chinês
      'ja': 'ウォレット'  // japonês
    },
    'expense': {
      'ar': 'نفقة',     // árabe
      'pt': 'Despesa',  // português
      'es': 'Gasto',    // espanhol
      'fr': 'Dépense',  // francês
      'de': 'Ausgabe',  // alemão
      'it': 'Spesa',    // italiano
      'ru': 'Расход',   // russo
      'zh': '支出',     // chinês
      'ja': '経費'      // japonês
    },
    'budget': {
      'ar': 'ميزانية',  // árabe
      'pt': 'Orçamento', // português
      'es': 'Presupuesto', // espanhol
      'fr': 'Budget',   // francês
      'de': 'Budget',   // alemão
      'it': 'Bilancio', // italiano
      'ru': 'Бюджет',   // russo
      'zh': '预算',     // chinês
      'ja': '予算'      // japonês
    }
  };
  
  // Verifica se a palavra existe no dicionário
  if (lastPart.toLowerCase() in commonWords) {
    const word = lastPart.toLowerCase();
    const translations = commonWords[word];
    
    // Retorna a tradução específica para o idioma, se disponível
    if (translations[language]) {
      return translations[language];
    }
  }
  
  // Formatação padrão para palavras não traduzidas diretamente
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}