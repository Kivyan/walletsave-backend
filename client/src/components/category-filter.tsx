import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";
import { Category } from "@shared/schema";
import { CATEGORY_TRANSLATION_MAP } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: number[];
  onSelectCategories: (categoryIds: number[]) => void;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onSelectCategories,
}: CategoryFilterProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<number[]>(selectedCategories);
  
  // Função de utilidade para traduzir nomes de categorias de forma centralizada
  const getTranslatedCategoryName = (categoryName: string): string => {
    // Normaliza o nome da categoria para comparação
    const normalizedName = categoryName.toLowerCase().trim();
    
    // Usa o mapa centralizado de categorias
    const translationKey = CATEGORY_TRANSLATION_MAP[normalizedName];
    
    if (translationKey) {
      // Usa a chave de tradução encontrada
      return t(translationKey, categoryName);
    }
    
    // Se não for uma categoria conhecida, tenta construir uma chave ou usa o nome original
    const generatedKey = `categories.${normalizedName.replace(/\s+/g, '_')}`;
    return t(generatedKey, categoryName);
  };

  const handleCheckboxChange = (categoryId: number, checked: boolean) => {
    if (checked) {
      setTempSelected([...tempSelected, categoryId]);
    } else {
      setTempSelected(tempSelected.filter((id) => id !== categoryId));
    }
  };

  const handleApply = () => {
    onSelectCategories(tempSelected);
    setOpen(false);
  };

  const handleSelectAll = () => {
    setTempSelected(categories.map((category) => category.id));
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center space-x-1 text-neutral-600 dark:text-neutral-400 text-sm"
        >
          <span>{t("common.filter")}</span>
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t("category.categories")}
            </h4>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs text-secondary dark:text-accent"
                onClick={handleSelectAll}
              >
                {t("common.select_all")}
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs text-secondary dark:text-accent"
                onClick={handleClearAll}
              >
                {t("common.clear")}
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-56 overflow-auto">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={tempSelected.includes(category.id)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(category.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="flex items-center text-sm cursor-pointer"
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  {getTranslatedCategoryName(category.name)}
                </Label>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <Button 
              className="w-full" 
              size="sm"
              onClick={handleApply}
            >
              {t("common.apply")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
