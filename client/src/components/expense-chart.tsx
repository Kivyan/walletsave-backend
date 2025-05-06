import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatMoney } from "@/lib/utils";
import { Expense, Category } from "@shared/schema";
import { TranslatedText } from "./translated-text";

interface ExpenseChartProps {
  expenses: Expense[];
  categories: Category[];
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
  translationKey: string;
  defaultName: string;
}

export function ExpenseChart({ expenses, categories }: ExpenseChartProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<ChartData[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!categories.length) return;

    // Group expenses by category
    const expensesByCategory: Record<number, number> = {};
    let totalAmount = 0;

    // Se não houver despesas, vamos mostrar as categorias com valores zerados
    if (!expenses.length) {
      // Em vez de não mostrar nada, vamos exibir todas as categorias com valores iguais
      categories.forEach((category) => {
        expensesByCategory[category.id] = 1; // Valor simbólico apenas para exibir todas as categorias
        totalAmount += 1;
      });
    } else {
      expenses.forEach((expense) => {
        const amount = Number(expense.amount);
        totalAmount += amount;
        
        if (expensesByCategory[expense.categoryId]) {
          expensesByCategory[expense.categoryId] += amount;
        } else {
          expensesByCategory[expense.categoryId] = amount;
        }
      });
    }

    // Create chart data
    const chartData: ChartData[] = Object.entries(expensesByCategory).map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === Number(categoryId));
      const percentage = Math.round((amount / totalAmount) * 100);
      
      // Prepare category info for translations
      const categoryKey = category?.name.toLowerCase().replace(/\s+/g, '_') || 'unknown';
      const translationKey = `categories.${categoryKey}`;
      const defaultName = category?.name || t('common.unknown');
      
      // Use o hook de tradução para garantir que a tradução será atualizada quando o idioma mudar
      const translatedName = t(translationKey, { defaultValue: defaultName });
      
      return {
        name: translatedName,
        translationKey: translationKey, // Salvar a chave para usar com TranslatedText
        defaultName: defaultName,      // Salvar o nome padrão
        value: amount,
        color: category?.color || "#6B7280",
        percentage,
      };
    });

    // Sort by value (highest first)
    chartData.sort((a, b) => b.value - a.value);
    
    setData(chartData);
    setTotal(totalAmount);
  }, [expenses, categories]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-neutral-800 p-2 shadow rounded border border-neutral-200 dark:border-neutral-700">
          <TranslatedText 
            i18nKey={data.translationKey}
            className="font-medium"
            tag="p"
          >
            {data.defaultName}
          </TranslatedText>
          <p>{formatMoney(data.value)}</p>
          <p>{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Não é mais necessário verificar se não há dados, pois sempre mostramos pelo menos as categorias
  // Mesmo sem despesas reais, o gráfico será exibido com as categorias disponíveis

  return (
    <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0">
      {/* Chart */}
      <div className="w-full sm:w-1/2 flex justify-center items-center h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Chart legend */}
      <div className="w-full sm:w-1/2">
        <div className="text-center sm:text-left mb-4">
          <TranslatedText 
            i18nKey="expense.total"
            className="text-sm text-neutral-500 dark:text-neutral-400"
            tag="p"
          >
            Total de Despesas
          </TranslatedText>
          <p className="text-xl font-semibold">
            {total <= categories.length ? "-" : formatMoney(total)}
          </p>
        </div>
        <ul className="space-y-3">
          {data.map((item, index) => (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <TranslatedText 
                  i18nKey={item.translationKey}
                  className="text-sm text-neutral-700 dark:text-neutral-300"
                >
                  {item.defaultName}
                </TranslatedText>
              </div>
              <div>
                <span className="text-sm font-medium text-neutral-800 dark:text-white">
                  {total <= categories.length ? "-" : formatMoney(item.value)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                  {total <= categories.length ? "" : `(${item.percentage}%)`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
