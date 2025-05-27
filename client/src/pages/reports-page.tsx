import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Expense, Category } from "@shared/schema";
import { MonthSelector } from "@/components/month-selector";
import { formatMoney, formatDate, CATEGORY_TRANSLATION_MAP } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { subMonths, eachDayOfInterval, startOfMonth, endOfMonth, format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("monthly");

  // Function to get translated category name
  const getTranslatedCategoryName = (categoryName: string): string => {
    const normalizedName = categoryName.toLowerCase().trim();
    const translationKey = CATEGORY_TRANSLATION_MAP[normalizedName];
    
    if (translationKey) {
      const translation = t(translationKey, categoryName);
      if (translation === translationKey || translation.includes('.')) {
        return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      }
      return translation;
    }
    
    // Check if it's a Spanish category name
    const spanishKey = `categories.${normalizedName}`;
    const spanishTranslation = t(spanishKey, categoryName);
    if (spanishTranslation !== spanishKey && !spanishTranslation.includes('.')) {
      return spanishTranslation;
    }
    
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  // Get month and year from selected date
  const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
  const year = selectedDate.getFullYear();

  // Fetch all expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Filter expenses for the selected month
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year
    );
  });

  // Calculate total expenses for the month
  const totalMonthlyExpenses = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  // Group expenses by category for the monthly view
  const expensesByCategory = monthlyExpenses.reduce<Record<number, number>>(
    (acc, expense) => {
      const categoryId = expense.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += Number(expense.amount);
      return acc;
    },
    {}
  );

  // Prepare data for the pie chart
  const pieChartData = Object.entries(expensesByCategory).map(([categoryId, amount]) => {
    const category = categories.find((c) => c.id === Number(categoryId));
    return {
      name: category?.name || "Unknown",
      value: amount,
      color: category?.color || "#6B7280",
    };
  });

  // Get data for the last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(selectedDate, i);
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      date,
    };
  }).reverse();

  // Group expenses by month for the trends view
  const expensesByMonth = last6Months.map((monthData) => {
    const monthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() + 1 === monthData.month &&
        expenseDate.getFullYear() === monthData.year
      );
    });

    const totalAmount = monthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    return {
      name: format(monthData.date, "MMM"),
      amount: totalAmount,
    };
  });

  // Group expenses by day for the daily view
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate),
  });

  const expensesByDay = daysInMonth.map((day) => {
    const dayExpenses = monthlyExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getDate() === day.getDate();
    });

    const totalAmount = dayExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    return {
      name: format(day, "dd"),
      amount: totalAmount,
    };
  });

  // Format for the tooltip in charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-800 p-2 border border-neutral-200 dark:border-neutral-700 rounded shadow-md">
          <p className="text-sm font-medium">{`${label}`}</p>
          <p className="text-sm">{formatMoney(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-24 md:pb-0 overflow-y-auto custom-scrollbar">
      <Header title={t("navigation.reports")} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Month Selector */}
        <div className="flex justify-between items-center mb-6">
          <MonthSelector selected={selectedDate} onSelect={setSelectedDate} />
          
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {formatMoney(totalMonthlyExpenses)}
          </Badge>
        </div>

        {/* Report Tabs */}
        <Tabs 
          defaultValue="monthly" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="monthly">{t("reports.monthly")}</TabsTrigger>
            <TabsTrigger value="daily">{t("reports.daily")}</TabsTrigger>
            <TabsTrigger value="trends">{t("reports.trends")}</TabsTrigger>
          </TabsList>

          {/* Monthly tab content */}
          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>{t("expense.distribution")}</CardTitle>
                <CardDescription>
                  {t("reports.category_distribution_description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-6 sm:space-y-0">
                  {/* Pie chart */}
                  <div className="w-full sm:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={(entry) => entry.name}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category list */}
                  <div className="w-full sm:w-1/2">
                    <ul className="space-y-3">
                      {pieChartData.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">
                              {getTranslatedCategoryName(item.name)}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-neutral-800 dark:text-white">
                              {formatMoney(item.value)}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                              ({Math.round((item.value / totalMonthlyExpenses) * 100)}%)
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily tab content */}
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.daily_expenses")}</CardTitle>
                <CardDescription>
                  {t("reports.daily_expenses_description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesByDay}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="amount"
                        fill="#8B5CF6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends tab content */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.expense_trends")}</CardTitle>
                <CardDescription>
                  {t("reports.expense_trends_description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expensesByMonth}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="amount"
                        fill="#8B5CF6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Expenses */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("reports.recent_expenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyExpenses.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400">
                {t("expense.no_expenses")}
              </p>
            ) : (
              <div className="space-y-4">
                {monthlyExpenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((expense) => {
                    const category = categories.find((c) => c.id === expense.categoryId);
                    return (
                      <div
                        key={expense.id}
                        className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full mr-3 flex items-center justify-center"
                            style={{
                              backgroundColor: `${category?.color}20`,
                              color: category?.color,
                            }}
                          >
                            <i className={`fas fa-${category?.icon}`}></i>
                          </div>
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {formatDate(expense.date, i18n.language)}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-semibold ${
                            expense.isPaid ? "line-through opacity-60" : ""
                          }`}
                        >
                          {formatMoney(Number(expense.amount))}
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <MobileNavigation />
    </div>
  );
}
