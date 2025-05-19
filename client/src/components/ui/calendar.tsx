"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"
import type { Locale } from "date-fns"
import { 
  enUS, ptBR, es, fr, de, it, ja, ru, ar, zhCN 
} from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { ptBR as ptBRLocalized } from "date-fns/locale/pt-BR"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  labels?: {
    months?: string[];
    weekdays?: string[];
  }
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const { i18n } = useTranslation();
  
  // Mapa de idiomas para locale do date-fns
  const localeMap: Record<string, Locale> = {
    en: enUS,
    pt: ptBR,
    es: es,
    fr: fr,
    de: de,
    it: it,
    ja: ja,
    zh: zhCN,
    ru: ru,
    ar: ar
  };
  
  // Set the appropriate locale based on the current language
  const locale = props.locale || localeMap[i18n.language] || enUS;

  // Traduzimos os meses e dias da semana manualmente se o idioma for pt
  const translatedLabels = React.useMemo(() => {
    if (i18n.language === 'pt') {
      return {
        months: [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ],
        weekdays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        weekdaysLong: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
      };
    } else if (i18n.language === 'fr') {
      return {
        months: [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ],
        weekdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        weekdaysLong: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
      };
    } else if (i18n.language === 'es') {
      return {
        months: [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ],
        weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        weekdaysLong: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
      };
    }
    
    return undefined;
  }, [i18n.language]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-neutral-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-neutral-400",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-neutral-100/50 [&:has([aria-selected])]:bg-neutral-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-neutral-800/50 dark:[&:has([aria-selected])]:bg-neutral-800",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-neutral-900 text-neutral-50 hover:bg-neutral-900 hover:text-neutral-50 focus:bg-neutral-900 focus:text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50 dark:hover:text-neutral-900 dark:focus:bg-neutral-50 dark:focus:text-neutral-900",
        day_today: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50",
        day_outside:
          "day-outside text-neutral-500 opacity-50 aria-selected:bg-neutral-100/50 aria-selected:text-neutral-500 aria-selected:opacity-30 dark:text-neutral-400 dark:aria-selected:bg-neutral-800/50 dark:aria-selected:text-neutral-400",
        day_disabled: "text-neutral-500 opacity-50 dark:text-neutral-400",
        day_range_middle:
          "aria-selected:bg-neutral-100 aria-selected:text-neutral-900 dark:aria-selected:bg-neutral-800 dark:aria-selected:text-neutral-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      locale={locale}
      formatters={{
        // Forçamos a tradução dos meses e dias da semana
        formatCaption: (date, options) => {
          if (translatedLabels) {
            const month = translatedLabels.months[date.getMonth()];
            const year = date.getFullYear();
            return `${month} ${year}`;
          }
          return format(date, 'LLLL yyyy', { locale });
        },
        formatWeekdayName: (weekday, options) => {
          if (translatedLabels) {
            return translatedLabels.weekdays[weekday.getDay() === 0 ? 6 : weekday.getDay() - 1];
          }
          return format(weekday, 'EEEEEE', { locale });
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
