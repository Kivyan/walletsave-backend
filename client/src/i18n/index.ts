import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslations from "./locales/en";
import ptTranslations from "./locales/pt";

// Define available languages (apenas incluindo idiomas com traduções completas)
export const languages = {
  en: "English",
  pt: "Português",
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
if (storedLang && (storedLang === "en" || storedLang === "pt")) {
  i18n.changeLanguage(storedLang);
}

export default i18n;