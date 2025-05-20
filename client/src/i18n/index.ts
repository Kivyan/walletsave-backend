import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslations from "./locales/en";
import ptTranslations from "./locales/pt";
import esTranslations from "./locales/es";
import frTranslations from "./locales/fr";
import deTranslations from "./locales/de";
import itTranslations from "./locales/it";
import jaTranslations from "./locales/ja";
import zhTranslations from "./locales/zh";
import ruTranslations from "./locales/ru";
import arTranslations from "./locales/ar";

// Define available languages
export const languages = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ja: "日本語",
  zh: "中文",
  ru: "Русский",
  ar: "العربية",
};

// Get stored language preference
const getStoredLanguage = () => {
  const storedLang = localStorage.getItem("i18nextLng");
  // Only return if it's one of our supported languages
  if (storedLang && Object.keys(languages).includes(storedLang)) {
    return storedLang;
  }
  return null;
};

// Get browser language, but only if it's one of our supported languages
const getBrowserLanguage = () => {
  const browserLang = navigator.language.split('-')[0]; // Get base language code
  if (Object.keys(languages).includes(browserLang)) {
    return browserLang;
  }
  return null;
};

// Usar o idioma armazenado, o idioma do navegador, ou inglês como fallback
const storedLanguage = getStoredLanguage();
const browserLanguage = getBrowserLanguage();
const initialLanguage = storedLanguage || browserLanguage || "en";
console.log(`Iniciando com idioma: ${initialLanguage}`);

// Função para formatar textos com pontos quando não encontrar tradução
const formatKeyAsReadableText = (key: string): string => {
  // Extrai apenas a última parte da chave (após o último ponto)
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Converte de camelCase ou snake_case para formato legível
  return lastPart
    .replace(/([A-Z])/g, ' $1') // camelCase para espaços
    .replace(/_/g, ' ')         // snake_case para espaços
    .toLowerCase()
    .trim()
    .replace(/^\w/, c => c.toUpperCase()); // Primeira letra maiúscula
};

// Função para verificar se uma tradução está completa
export const isTranslationComplete = (key: string, translation: string): boolean => {
  // Verifica se a tradução existe e não é apenas a chave
  if (!translation || translation === key) return false;
  
  // Verifica se a tradução contém pontos (possível indicativo de chave não traduzida)
  if (translation.includes('.') && !translation.includes(' ')) return false;
  
  return true;
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
  resources: {
    en: {
      translation: enTranslations,
    },
    pt: {
      translation: ptTranslations,
    },
    es: {
      translation: esTranslations,
    },
    fr: {
      translation: frTranslations,
    },
    de: {
      translation: deTranslations,
    },
    it: {
      translation: itTranslations,
    },
    ja: {
      translation: jaTranslations,
    },
    zh: {
      translation: zhTranslations,
    },
    ru: {
      translation: ruTranslations,
    },
    ar: {
      translation: arTranslations,
    },
  },
  lng: initialLanguage, // Set initial language
  fallbackLng: "en",
  load: 'languageOnly', // Load only the language code (e.g., 'pt' instead of 'pt-BR')
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ['localStorage', 'navigator'],
    lookupLocalStorage: 'i18nextLng',
    caches: ['localStorage'],
  },
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged loaded', // React to language changes and loading events
    bindI18nStore: 'added removed', // React to resource store changes
  },
  // Ensure keys/translations are loaded before rendering
  partialBundledLanguages: false,
  preload: Object.keys(languages), // Preload all languages
  
  // Personaliza o comportamento quando uma chave não é encontrada
  saveMissing: false,
  missingKeyHandler: (lngs, ns, key) => {
    console.log(`Tradução faltando: ${key}`);
  },
  
  // Esta função é chamada quando a tradução não é encontrada
  // Aqui modificamos para converter chaves em texto legível em vez de mostrar a chave original
  parseMissingKeyHandler: (key) => {
    // Se a chave contém pontos, formata para exibição
    if (key.includes('.')) {
      return formatKeyAsReadableText(key);
    }
    return key;
  }
});

// Make sure the language is saved in localStorage when changed
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("i18nextLng", lng);
  document.documentElement.lang = lng; // Also set the html lang attribute
  
  // If the app direction should change based on language (for RTL languages like Arabic)
  if (lng === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
});

// Apply the initial language settings to the HTML element
document.documentElement.lang = initialLanguage;
if (initialLanguage === 'ar') {
  document.documentElement.dir = 'rtl';
} else {
  document.documentElement.dir = 'ltr';
}

// Public method to change language that ensures all side effects are applied
export const changeLanguage = async (lang: string) => {
  if (Object.keys(languages).includes(lang)) {
    await i18n.changeLanguage(lang);
    return true;
  }
  return false;
};

export default i18n;