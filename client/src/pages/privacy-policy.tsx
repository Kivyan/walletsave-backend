import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/back-button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <BackButton />
        <h1 className="ml-2 text-2xl font-bold">{t("legal.privacy_policy")}</h1>
      </div>
      
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <ScrollArea className="h-[70vh]">
          <div className="pr-4">
            <h2 className="mb-4 text-xl font-semibold">{t("legal.privacy_title")}</h2>
            <p className="mb-4">{t("legal.privacy_last_updated")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.privacy_section_1_title")}</h3>
            <p className="mb-4">{t("legal.privacy_section_1_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.privacy_section_2_title")}</h3>
            <p className="mb-4">{t("legal.privacy_section_2_content")}</p>

            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.privacy_section_3_title")}</h3>
            <p className="mb-4">{t("legal.privacy_section_3_content")}</p>

            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.privacy_section_4_title")}</h3>
            <p className="mb-4">{t("legal.privacy_section_4_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.privacy_section_5_title")}</h3>
            <p className="mb-4">{t("legal.privacy_section_5_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.privacy_section_6_title")}</h3>
            <p className="mb-4">{t("legal.privacy_section_6_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.privacy_section_7_title")}</h3>
            <p className="mb-4">{t("legal.privacy_section_7_content")}</p>
            
            <h3 className="mb-2 mt-6 text-lg font-medium">{t("legal.contact_title")}</h3>
            <p className="mb-4">{t("legal.contact_content")}</p>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}