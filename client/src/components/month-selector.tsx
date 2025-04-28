import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { getLocaleFromLanguage } from "@/lib/utils";
import { format } from "date-fns";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface MonthSelectorProps {
  selected: Date;
  onSelect: (date: Date) => void;
}

export function MonthSelector({ selected, onSelect }: MonthSelectorProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  
  const locale = getLocaleFromLanguage(i18n.language);
  const formattedMonth = format(selected, "MMMM yyyy", { locale });
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onSelect(date);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 text-neutral-700 dark:text-neutral-300 py-1 px-3 rounded-md"
        >
          <CalendarIcon className="h-4 w-4" />
          <span>{formattedMonth}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="default"
          selected={selected}
          onSelect={handleSelect as any}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}