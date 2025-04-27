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
  lng: "en", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Save language preference when changed
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("i18nextLng", lng);
});

// Initialize with stored language on app load
const storedLang = localStorage.getItem("i18nextLng");
if (storedLang) {
  i18n.changeLanguage(storedLang);
}

export default i18n;