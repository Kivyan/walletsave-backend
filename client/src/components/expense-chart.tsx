import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney, CATEGORY_TRANSLATION_MAP } from "@/lib/utils";
import { Expense, Category } from "@shared/schema";

interface ExpenseChartProps {
  expenses: Expense[];
  categories: Category[];
}

interface ChartData {
  name: string;         // Nome original da categoria
  translationKey: string; // Chave para tradução
  value: number;
  color: string;
  percentage: number;
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
      
      // Obtemos o nome da categoria
      const categoryName = category?.name || "Unknown";
      
      // Criamos a chave de tradução baseada no nome da categoria
      // Mapeamento direto das categorias para chaves de tradução
      const translationKey = `categories.${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Log para depuração - aparecerá no console
      console.log(`Category: ${categoryName}, Translation Key: ${translationKey}`);
      
      return {
        name: categoryName,             // Nome original da categoria
        translationKey: translationKey, // Chave para tradução
        value: amount,
        color: category?.color || "#6B7280",
        percentage,
      };
    });

    // Sort by value (highest first)
    chartData.sort((a, b) => b.value - a.value);
    
    setData(chartData);
    setTotal(totalAmount);
  }, [expenses, categories, t]);

  // Função para obter o nome traduzido da categoria
  // Utiliza o mapeamento centralizado de categorias do arquivo utils.ts
  const getTranslatedCategoryName = (categoryName: string): string => {
    // Normaliza o nome da categoria para comparação
    const normalizedName = categoryName.toLowerCase().trim();
    
    // Usa o mapa centralizado de categorias importado de utils.ts
    // Isso garante que todas as categorias sejam traduzidas de forma consistente em toda a aplicação
    const translationKey = CATEGORY_TRANSLATION_MAP[normalizedName];
    
    if (translationKey) {
      // Usa a chave de tradução encontrada
      return t(translationKey, categoryName);
    }
    
    // Se não for uma categoria conhecida, tenta construir uma chave de tradução ou usa o nome original
    const generatedKey = `categories.${normalizedName.replace(/\s+/g, '_')}`;
    return t(generatedKey, categoryName);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Usa a função de tradução para obter o nome traduzido
      const displayName = getTranslatedCategoryName(data.name);
      
      return (
        <div className="bg-white dark:bg-neutral-800 p-2 shadow rounded border border-neutral-200 dark:border-neutral-700">
          <p className="font-medium">
            {displayName}
          </p>
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
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("expense.total")}
          </p>
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
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {getTranslatedCategoryName(item.name)}
                </span>
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
