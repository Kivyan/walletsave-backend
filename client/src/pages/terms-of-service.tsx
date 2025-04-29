import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/back-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { LanguageSelector } from "@/components/language-selector";

export default function TermsOfService() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  // Update component when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(i18n.language);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <div className="h-full flex flex-col container mx-auto px-4 py-8 overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <BackButton />
          <h1 className="ml-2 text-2xl font-bold">{t("legal.terms_of_service")}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <LanguageSelector />
          <Link href="/privacy-policy">
            <a className="text-sm text-secondary dark:text-accent hover:underline">
              {t("legal.privacy_policy")}
            </a>
          </Link>
        </div>
      </div>
      
      <div className="flex-1 rounded-lg border bg-card p-6 shadow-sm">
        <ScrollArea className="h-full">
          <div className="pr-4">
            <h2 className="mb-4 text-xl font-semibold">{t("legal.terms_title")}</h2>
            <p className="mb-4">{t("legal.terms_last_updated")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.terms_section_1_title")}</h3>
            <p className="mb-4">{t("legal.terms_section_1_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.terms_section_2_title")}</h3>
            <p className="mb-4">{t("legal.terms_section_2_content")}</p>

            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.terms_section_3_title")}</h3>
            <p className="mb-4">{t("legal.terms_section_3_content")}</p>

            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.terms_section_4_title")}</h3>
            <p className="mb-4">{t("legal.terms_section_4_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.terms_section_5_title")}</h3>
            <p className="mb-4">{t("legal.terms_section_5_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.terms_section_6_title")}</h3>
            <p className="mb-4">{t("legal.terms_section_6_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.terms_section_7_title")}</h3>
            <p className="mb-4">{t("legal.terms_section_7_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.terms_section_8_title")}</h3>
            <p className="mb-4">{t("legal.terms_section_8_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.contact_title")}</h3>
            <p className="mb-4">{t("legal.contact_content")}</p>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}