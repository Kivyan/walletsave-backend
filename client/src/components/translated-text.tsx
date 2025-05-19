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
  
  // Tratamento especial para categorias e outros textos
  let content = children;
  
  // Traduções forçadas para certos elementos em Árabe
  const arabicTranslations: Record<string, string> = {
    "app.name": "Wallet Save",
    "wallet.wallets": "المحافظ",
    "navigation.wallet": "المحفظة",
    "wallet.my_wallets": "محافظي",
    "finance.manage_wallets": "إدارة المحافظ",
    "finance.financial_summary": "الملخص المالي",
    "finance.overview": "نظرة عامة",
    "finance.total_balance": "الرصيد الإجمالي",
    "budget.budget": "الميزانية",
    "navigation.finance": "المالية",
    "navigation.home": "الرئيسية",
    "navigation.profile": "الملف الشخصي",
    "navigation.reports": "التقارير",
    "navigation.savings": "المدخرات",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل"
  };
  
  // Casos especiais para o idioma árabe
  if (isArabic) {
    // Tratamento manual para termos específicos em árabe
    if (i18nKey === "navigation.finance") {
      content = "المالية";
    }
    else if (i18nKey === "wallet.wallets") {
      content = "المحافظ";
    }
    else if (i18nKey === "navigation.wallet") {
      content = "المحفظة";
    }
    else if (i18nKey === "wallet.my_wallets") {
      content = "محافظي";
    }
    else if (i18nKey === "finance.manage_wallets") {
      content = "إدارة المحافظ";
    }
    else if (i18nKey === "finance.overview") {
      content = "نظرة عامة";
    }
    else if (i18nKey === "finance.financial_summary") {
      content = "الملخص المالي";
    }
    else if (i18nKey === "finance.total_balance") {
      content = "الرصيد الإجمالي";
    }
    else if (i18nKey === "budget.budget") {
      content = "الميزانية";
    }
    else if (i18nKey === "navigation.home") {
      content = "الرئيسية";
    }
    else if (i18nKey === "navigation.profile") {
      content = "الملف الشخصي";
    }
    else if (i18nKey === "navigation.reports") {
      content = "التقارير";
    }
    else if (i18nKey === "navigation.savings") {
      content = "المدخرات";
    }
    // Outras traduções em árabe podem ser adicionadas aqui
  }
  // Sempre mostra Wallet Save como nome do app, independente do idioma
  else if (i18nKey === "app.name") {
    content = "Wallet Save";
  } 
  // Tratamento especial para categorias
  else if (i18nKey.startsWith("categories.")) {
    // Alta prioridade de tradução para categorias
    const categoryKey = i18nKey;
    const translation = t(categoryKey, values);
    
    // Se a tradução retornar a própria chave, extrai o nome da categoria
    if (translation === categoryKey || (typeof translation === 'string' && translation.includes('.'))) {
      const category = i18nKey.split('.')[1];
      const readable = category
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .toLowerCase()
        .trim()
        .replace(/^\w/, c => c.toUpperCase());
      
      content = children || readable;
    } else {
      content = translation;
    }
  } 
  // Para todas as outras chaves, usamos a tradução normal
  else {
    const translation = t(i18nKey, values);
    
    // Verificações para evitar exibição de chaves de tradução
    if (translation === i18nKey) {
      // Se não há tradução adequada, use o texto filho como fallback
      content = children;
    } else if (typeof translation === 'string' && translation.includes('.') && !translation.includes(' ')) {
      // Se parece uma chave não traduzida, tenta transformar em texto legível
      const parts = translation.split('.');
      const lastPart = parts[parts.length - 1];
      
      // Formata o texto
      const readable = lastPart
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .toLowerCase()
        .trim()
        .replace(/^\w/, c => c.toUpperCase());
      
      content = children || readable;
    } else {
      content = translation;
    }
  }
  
  // CSS condicional para idioma árabe
  const arabicClass = isArabic ? 'arabic-font ' : '';
  
  // Força re-renderização quando o idioma mudar (usando a chave)
  return (
    <Tag key={componentKey} className={`i18n-text ${arabicClass}${className || ''}`} style={style}>
      {content}
    </Tag>
  );
}