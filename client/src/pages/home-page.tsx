import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Expense, Category, Wallet, Saving, Budget } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { MonthSelector } from "@/components/month-selector";
import { ExpensesList } from "@/components/expenses-list";
import { ExpenseChart } from "@/components/expense-chart";
import { Plus, Folders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NotificationService from "@/components/notification-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, calculateBudgetPercentage } from "@/lib/utils";

import { ReactElement } from "react";

export default function HomePage(): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  
  // Estados para o componente Finance
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Form schema
  const formSchema = z.object({
    amount: z.coerce
      .number()
      .min(1, { message: t("budget.amount_required") || "Valor é obrigatório" }),
    month: z.coerce.number(),
    year: z.coerce.number(),
    notes: z.string().optional(),
  });

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: currentBudget ? Number(currentBudget.amount) : "",
      month,
      year,
      notes: currentBudget?.notes || "",
    },
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (data: InsertBudget) => {
      const res = await apiRequest("POST", "/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("budget.create_success"),
        description: t("budget.create_success_description") || "Orçamento criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      setIsBudgetDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("budget.create_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (data: { id: number; budget: Partial<Budget> }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/budgets/${data.id}`,
        data.budget
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("budget.update_success"),
        description: t("budget.update_success_description") || "Orçamento atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      setIsBudgetDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("budget.update_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submit handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (currentBudget) {
      updateBudgetMutation.mutate({
        id: currentBudget.id,
        budget: {
          amount: String(values.amount),
          month: values.month,
          year: values.year,
          notes: values.notes
        },
      });
    } else {
      createBudgetMutation.mutate({
        amount: String(values.amount),
        month: values.month,
        year: values.year,
        notes: values.notes
      } as InsertBudget);
    }
  }
  
  // Get month and year from selected date
  const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
  const year = selectedDate.getFullYear();

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user,
  });

  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });
  
  // Fetch budget for current month/year
  const { data: currentBudget } = useQuery<Budget>({
    queryKey: ["/api/budgets/current"],
    enabled: !!user,
  });
  
  // Fetch wallets for notification service
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
    enabled: !!user,
  });
  
  // Fetch savings for notification service
  const { data: savings = [] } = useQuery<Saving[]>({
    queryKey: ["/api/savings"],
    enabled: !!user,
  });
  
  // Mutação para criar categorias padrão
  const createDefaultCategoriesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/categories/default");
    },
    onSuccess: () => {
      refetchCategories();
      toast({
        title: t("categories.created_success"),
        description: t("categories.created_description") || "Categorias padrão criadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("categories.created_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter expenses for the selected month
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() + 1 === month && 
      expenseDate.getFullYear() === year
    );
  });

  // Calculate total expenses for the month
  const totalExpenses = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount), 
    0
  );
  
  // Calculate total balance
  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.balance),
    0
  );
  
  // Função para criar categorias padrão
  const handleCreateDefaultCategories = () => {
    createDefaultCategoriesMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-16 md:pb-0 overflow-y-auto custom-scrollbar">
      <Header title={t("navigation.home")} />
      
      {/* Sub Header with Date and Add Button */}
      <div className="bg-white dark:bg-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Date selector */}
            <div className="flex items-center gap-4">
              <MonthSelector 
                selected={selectedDate} 
                onSelect={setSelectedDate} 
              />
              
              {/* Notification Service */}
              <div className="hidden md:block">
                <NotificationService 
                  expenseData={expenses}
                  budgetData={currentBudget}
                  walletData={wallets}
                  savingsData={savings}
                />
              </div>
            </div>

            {/* Add expense button */}
            <Button
              className="bg-secondary hover:bg-secondary/90 text-white py-1 px-3 rounded-md flex items-center space-x-1"
              onClick={() => setIsAddExpenseOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>{t("common.add")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {categories && categories.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mb-6">
            <div className="text-center">
              <Folders className="h-12 w-12 mx-auto text-neutral-400" />
              <h2 className="mt-2 text-xl font-semibold text-neutral-800 dark:text-white">
                Sem categorias disponíveis
              </h2>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Você precisa criar categorias antes de adicionar despesas.
              </p>
              <Button
                className="mt-4"
                onClick={handleCreateDefaultCategories}
                disabled={createDefaultCategoriesMutation.isPending}
              >
                {createDefaultCategoriesMutation.isPending ? "Criando..." : "Criar Categorias Padrão"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Access Navigation Buttons */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <Link href="/reports" className="bg-white dark:bg-neutral-800 rounded-lg shadow flex flex-col items-center justify-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-neutral-800 dark:text-white font-medium">{t("navigation.reports")}</span>
              </Link>
              
              <Link href="/savings" className="bg-white dark:bg-neutral-800 rounded-lg shadow flex flex-col items-center justify-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-neutral-800 dark:text-white font-medium">{t("navigation.savings")}</span>
              </Link>
            </div>
            
            {/* Finance Overview */}
            <div className="mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="overview">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t("finance.overview") || "Visão Geral"}
                    </TabsTrigger>
                    <TabsTrigger value="budget">
                      <LineChart className="h-4 w-4 mr-2" />
                      {t("finance.budget") || "Orçamento"}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-4">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Wallet Balance Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                          {t("wallet.total_balance") || "Saldo Total"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(totalBalance)}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {wallets.length} {t("wallet.accounts") || "contas"}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Budget Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                          {t("budget.monthly") || "Orçamento Mensal"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {currentBudget ? formatMoney(Number(currentBudget.amount)) : "--"}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {currentBudget ? calculateBudgetPercentage(totalExpenses, Number(currentBudget.amount)) : 0}% {t("budget.used") || "utilizado"}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Expenses Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                          {t("expense.monthly_total") || "Despesas do Mês"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(totalExpenses)}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {monthlyExpenses.length} {t("expense.transactions") || "transações"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="budget" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{t("budget.management") || "Gerenciamento de Orçamento"}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsBudgetDialogOpen(true)}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          {currentBudget ? t("budget.edit") : t("budget.create") || "Criar"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentBudget ? (
                        <>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Progresso</span>
                            <span className="text-sm font-medium">
                              {calculateBudgetPercentage(totalExpenses, Number(currentBudget.amount))}%
                            </span>
                          </div>
                          <Progress 
                            value={calculateBudgetPercentage(totalExpenses, Number(currentBudget.amount))} 
                            className={`h-2 ${totalExpenses > Number(currentBudget.amount) ? '[&>div]:bg-red-500' : ''}`}
                          />

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">Orçamento</p>
                              <p className="text-lg font-bold">{formatMoney(Number(currentBudget.amount))}</p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">Utilizado</p>
                              <p className="text-lg font-bold">{formatMoney(totalExpenses)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">Disponível</p>
                              <p className={`text-lg font-bold ${totalExpenses > Number(currentBudget.amount) ? 'text-red-500' : 'text-green-500'}`}>
                                {formatMoney(Number(currentBudget.amount) - totalExpenses)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">Média por dia</p>
                              <p className="text-lg font-bold">
                                {formatMoney(Number(currentBudget.amount) / new Date(year, month, 0).getDate())}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                            {t("budget.no_budget") || "Nenhum orçamento definido para este mês"}
                          </p>
                          <Button onClick={() => setIsBudgetDialogOpen(true)}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            {t("budget.create") || "Criar Orçamento"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Expenses List - Mostrar todas as despesas */}
            <ExpensesList 
              expenses={expenses} 
              categories={categories} 
            />
            
            {/* Expense Chart */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-heading font-semibold text-neutral-800 dark:text-white mb-4">
                {t("expense.distribution")}
              </h2>
              
              <ExpenseChart 
                expenses={expenses} 
                categories={categories} 
              />
            </div>
          </>
        )}
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
      />
      
      {/* Budget Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentBudget ? t("budget.edit_title") : t("budget.create_title") || "Criar Orçamento"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("budget.amount") || "Valor do Orçamento"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("budget.notes") || "Observações"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("budget.notes_placeholder") || "Observações sobre o orçamento"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBudgetDialogOpen(false)}
                >
                  {t("common.cancel") || "Cancelar"}
                </Button>
                <Button
                  type="submit"
                  disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending}
                >
                  {(createBudgetMutation.isPending || updateBudgetMutation.isPending)
                    ? t("common.saving") || "Salvando..."
                    : currentBudget
                      ? t("common.update") || "Atualizar"
                      : t("common.create") || "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
