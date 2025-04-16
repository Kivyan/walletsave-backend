import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

export function formatDate(date: Date | string, language: string = "en"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const locale = language === "pt" ? ptBR : enUS;
  return format(dateObj, "PPP", { locale });
}

export function getMonthName(month: number, language: string = "en"): string {
  const date = new Date(2023, month - 1, 1);
  const locale = language === "pt" ? ptBR : enUS;
  return format(date, "LLLL", { locale });
}

export function getCurrentMonthYear(language: string = "en"): string {
  const date = new Date();
  const locale = language === "pt" ? ptBR : enUS;
  return format(date, "MMMM yyyy", { locale });
}

export function calculateBudgetPercentage(expenses: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(Math.round((expenses / budget) * 100), 100);
}

export function calculateRemainingBudget(budget: number, expenses: number): number {
  return Math.max(budget - expenses, 0);
}

export const CATEGORY_COLORS = {
  housing: { bg: "bg-red-500", light: "bg-red-100", text: "text-red-500" },
  transportation: { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-500" },
  food: { bg: "bg-green-500", light: "bg-green-100", text: "text-green-500" },
  entertainment: { bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-500" },
  health: { bg: "bg-amber-500", light: "bg-amber-100", text: "text-amber-500" },
  education: { bg: "bg-indigo-500", light: "bg-indigo-100", text: "text-indigo-500" },
  shopping: { bg: "bg-pink-500", light: "bg-pink-100", text: "text-pink-500" },
  utilities: { bg: "bg-cyan-500", light: "bg-cyan-100", text: "text-cyan-500" },
  other: { bg: "bg-gray-500", light: "bg-gray-100", text: "text-gray-500" },
};

export const DEFAULT_CATEGORIES = [
  { name: "Housing", color: "#EF4444", icon: "home" },
  { name: "Transportation", color: "#3B82F6", icon: "car" },
  { name: "Food", color: "#22C55E", icon: "shopping-basket" },
  { name: "Entertainment", color: "#8B5CF6", icon: "film" },
  { name: "Health", color: "#F59E0B", icon: "heart" },
  { name: "Education", color: "#6366F1", icon: "book" },
  { name: "Shopping", color: "#EC4899", icon: "shopping-bag" },
  { name: "Utilities", color: "#06B6D4", icon: "zap" },
  { name: "Other", color: "#6B7280", icon: "more-horizontal" },
];
