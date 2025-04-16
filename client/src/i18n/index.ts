import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en";
import ptTranslations from "./locales/pt";

// Define available languages
export const languages = {
  en: "English",
  pt: "Português",
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    pt: {
      translation: ptTranslations,
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
