import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lista de moedas suportadas com seus respectivos locales
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar (USD)", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro (EUR)", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound (GBP)", symbol: "£", locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen (JPY)", symbol: "¥", locale: "ja-JP" },
  { code: "CNY", name: "Chinese Yuan (CNY)", symbol: "¥", locale: "zh-CN" },
  { code: "BRL", name: "Brazilian Real (BRL)", symbol: "R$", locale: "pt-BR" },
  { code: "CAD", name: "Canadian Dollar (CAD)", symbol: "CA$", locale: "en-CA" },
  { code: "AUD", name: "Australian Dollar (AUD)", symbol: "A$", locale: "en-AU" },
  { code: "INR", name: "Indian Rupee (INR)", symbol: "₹", locale: "en-IN" },
  { code: "RUB", name: "Russian Ruble (RUB)", symbol: "₽", locale: "ru-RU" },
  { code: "KRW", name: "South Korean Won (KRW)", symbol: "₩", locale: "ko-KR" },
  { code: "CHF", name: "Swiss Franc (CHF)", symbol: "CHF", locale: "de-CH" },
  { code: "MXN", name: "Mexican Peso (MXN)", symbol: "MX$", locale: "es-MX" },
  { code: "SGD", name: "Singapore Dollar (SGD)", symbol: "S$", locale: "en-SG" },
  { code: "HKD", name: "Hong Kong Dollar (HKD)", symbol: "HK$", locale: "zh-HK" },
  { code: "SEK", name: "Swedish Krona (SEK)", symbol: "kr", locale: "sv-SE" },
  { code: "ZAR", name: "South African Rand (ZAR)", symbol: "R", locale: "en-ZA" },
  { code: "AED", name: "UAE Dirham (AED)", symbol: "د.إ", locale: "ar-AE" },
  { code: "PLN", name: "Polish Zloty (PLN)", symbol: "zł", locale: "pl-PL" },
  { code: "NGN", name: "Nigerian Naira (NGN)", symbol: "₦", locale: "en-NG" },
];

export function formatMoney(amount: number, currency: string = "BRL"): string {
  // Encontra o locale correspondente à moeda
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency) || 
                       SUPPORTED_CURRENCIES.find(c => c.code === "BRL")!;
  
  return new Intl.NumberFormat(currencyInfo.locale, {
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

// Função para obter o locale adequado baseado no idioma selecionado
function getLocaleFromLanguage(language: string = "en") {
  switch (language) {
    case "pt": return ptBR;
    case "es": return require("date-fns/locale/es").default;
    case "fr": return require("date-fns/locale/fr").default;
    case "de": return require("date-fns/locale/de").default;
    case "it": return require("date-fns/locale/it").default;
    case "ja": return require("date-fns/locale/ja").default;
    case "zh": return require("date-fns/locale/zh-CN").default;
    case "ru": return require("date-fns/locale/ru").default;
    case "ar": return require("date-fns/locale/ar-SA").default;
    default: return enUS;
  }
}

export function formatDate(date: Date | string, language: string = "en"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const locale = getLocaleFromLanguage(language);
  return format(dateObj, "PPP", { locale });
}

export function getMonthName(month: number, language: string = "en"): string {
  const date = new Date(2023, month - 1, 1);
  const locale = getLocaleFromLanguage(language);
  return format(date, "LLLL", { locale });
}

export function getCurrentMonthYear(language: string = "en"): string {
  const date = new Date();
  const locale = getLocaleFromLanguage(language);
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
