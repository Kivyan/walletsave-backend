import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslations from "./locales/en";
import ptTranslations from "./locales/pt";

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
    // Para os outros idiomas, usamos o inglês como fallback
    // até que as traduções sejam adicionadas
    es: {
      translation: enTranslations,
    },
    fr: {
      translation: enTranslations,
    },
    de: {
      translation: enTranslations,
    },
    it: {
      translation: enTranslations,
    },
    ja: {
      translation: enTranslations,
    },
    zh: {
      translation: enTranslations,
    },
    ru: {
      translation: enTranslations,
    },
    ar: {
      translation: enTranslations,
    },
  },
  lng: localStorage.getItem("i18nextLng") || navigator.language.split("-")[0] || "en",
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

export default i18n;
