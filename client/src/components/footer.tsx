import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="mt-auto py-4 px-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          © 2025 Kivyan Avila. {t("common.all_rights_reserved")}
        </p>
      </div>
    </footer>
  );
}