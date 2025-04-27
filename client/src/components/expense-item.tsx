import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney, formatDate } from "@/lib/utils";
import { Expense, Category } from "@shared/schema";
import { Edit, Copy, Check, Trash, MoreHorizontal } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";

interface ExpenseItemProps {
  expense: Expense;
  category: Category;
  onEdit: (expense: Expense) => void;
}

export function ExpenseItem({ expense, category, onEdit }: ExpenseItemProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const deleteExpenseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/expenses/${expense.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: t("toast.expense_deleted"),
        description: t("toast.expense_deleted_description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/expenses/${expense.id}`, { isPaid: !expense.isPaid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: expense.isPaid ? t("toast.expense_marked_unpaid") : t("toast.expense_marked_paid"),
        description: expense.isPaid ? t("toast.expense_marked_unpaid_description") : t("toast.expense_marked_paid_description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const duplicateExpenseMutation = useMutation({
    mutationFn: async () => {
      const { id, createdAt, ...expenseData } = expense;
      await apiRequest("POST", "/api/expenses", expenseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: t("toast.expense_duplicated"),
        description: t("toast.expense_duplicated_description"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEdit(expense);
  };

  const handleDuplicate = () => {
    setIsMenuOpen(false);
    duplicateExpenseMutation.mutate();
  };

  const handleMarkAsPaid = () => {
    setIsMenuOpen(false);
    markAsPaidMutation.mutate();
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    deleteExpenseMutation.mutate();
  };

  // Create class strings based on the category color
  const colorClasses = {
    indicator: `bg-[${category.color}]`,
    iconBg: `bg-[${category.color}]/10 dark:bg-[${category.color}]/30`,
    iconText: `text-[${category.color}]`,
    tagBg: `bg-[${category.color}]/10 dark:bg-[${category.color}]/30`,
    tagText: `text-[${category.color}]`,
  };

  const isPending = deleteExpenseMutation.isPending || markAsPaidMutation.isPending || duplicateExpenseMutation.isPending;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div 
          className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 relative flex items-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          onClick={handleEdit}
        >
          {/* Color category indicator */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${colorClasses.indicator}`}
            style={{ backgroundColor: category.color }}
          />

          <div className="flex justify-between items-center w-full ml-2">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses.iconBg}`}
                style={{ backgroundColor: `${category.color}20` }}
              >
                <i
                  className={`fas fa-${category.icon} ${colorClasses.iconText}`}
                  style={{ color: category.color }}
                ></i>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-white flex items-center">
                  {expense.description}
                  <Edit className="ml-2 h-3 w-3 text-neutral-400" />
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatDate(expense.date)} • {expense.isFixed ? t("expense.fixed") : t("expense.variable")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold text-neutral-800 dark:text-white ${expense.isPaid ? 'line-through opacity-60' : ''}`}>
                {formatMoney(Number(expense.amount))}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded ${colorClasses.tagBg} ${colorClasses.tagText}`}
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.name}
              </span>
            </div>

            {/* Mobile dropdown menu */}
            <div className="ml-2 md:hidden">
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleEdit} disabled={isPending}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t("expense.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} disabled={isPending}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t("expense.duplicate")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMarkAsPaid} disabled={isPending}>
                    <Check className="mr-2 h-4 w-4" />
                    {expense.isPaid ? t("expense.mark_unpaid") : t("expense.mark_paid")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {t("expense.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>

      {/* Desktop context menu (right-click) */}
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleEdit} disabled={isPending}>
          <Edit className="mr-2 h-4 w-4" />
          {t("expense.edit")}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDuplicate} disabled={isPending}>
          <Copy className="mr-2 h-4 w-4" />
          {t("expense.duplicate")}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleMarkAsPaid} disabled={isPending}>
          <Check className="mr-2 h-4 w-4" />
          {expense.isPaid ? t("expense.mark_unpaid") : t("expense.mark_paid")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={handleDelete}
          disabled={isPending}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          {t("expense.delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
