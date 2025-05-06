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

// Determine the initial language to use
const initialLanguage = getStoredLanguage() || getBrowserLanguage() || "en";

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
  },
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