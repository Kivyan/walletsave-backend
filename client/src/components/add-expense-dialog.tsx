import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertExpenseSchema, Expense, Category } from "@shared/schema";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { getLocaleFromLanguage, formatDate } from "@/lib/utils";
import { TranslatedText } from "@/components/translated-text";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editExpense?: Expense | null;
}

export function AddExpenseDialog({ open, onOpenChange, editExpense }: AddExpenseDialogProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });
  
  // Create form validation schema
  const formSchema = z.object({
    description: z.string().min(1, t("validation.description_required")),
    amount: z.string().min(1, t("validation.amount_required")).refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      t("validation.amount_positive")
    ),
    date: z.date({
      required_error: t("validation.date_required"),
    }),
    categoryId: z.string().min(1, t("validation.category_required")),
    isFixed: z.string(),
    isRecurring: z.boolean().default(false),
    recurringFrequency: z.string().optional(),
    recurringEndDate: z.date().optional(),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      date: new Date(),
      categoryId: "",
      isFixed: "fixed",
      isRecurring: false,
      recurringFrequency: "monthly",
    },
  });
  
  // Update form with editExpense data if provided
  useEffect(() => {
    if (editExpense) {
      form.reset({
        description: editExpense.description,
        amount: String(editExpense.amount),
        date: new Date(editExpense.date),
        categoryId: String(editExpense.categoryId),
        isFixed: editExpense.isFixed ? "fixed" : "variable",
        isRecurring: editExpense.isRecurring,
        recurringFrequency: editExpense.recurringFrequency || "monthly",
        recurringEndDate: editExpense.recurringEndDate ? new Date(editExpense.recurringEndDate) : undefined,
      });
      
      setShowRecurringOptions(editExpense.isRecurring);
    } else {
      form.reset({
        description: "",
        amount: "",
        date: new Date(),
        categoryId: categories && categories.length > 0 ? String(categories[0].id) : "",
        isFixed: "fixed",
        isRecurring: false,
        recurringFrequency: "monthly",
      });
      
      setShowRecurringOptions(false);
    }
  }, [editExpense, categories, form]);
  
  // Add/update expense mutation
  const expenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        description: data.description,
        amount: Number(data.amount),
        date: data.date,
        categoryId: Number(data.categoryId),
        isFixed: data.isFixed === "fixed",
        isRecurring: data.isRecurring,
        recurringFrequency: data.isRecurring ? data.recurringFrequency : undefined,
        recurringEndDate: data.isRecurring ? data.recurringEndDate : undefined,
        isPaid: editExpense?.isPaid || false,
        userId: user!.id,
      };
      
      if (editExpense) {
        await apiRequest("PUT", `/api/expenses/${editExpense.id}`, payload);
      } else {
        await apiRequest("POST", "/api/expenses", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      onOpenChange(false);
      toast({
        title: editExpense 
          ? t("toast.expense_updated") 
          : t("toast.expense_added"),
        description: editExpense 
          ? t("toast.expense_updated_description") 
          : t("toast.expense_added_description"),
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
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    expenseMutation.mutate(values);
  };
  
  // Handle recurring toggle
  const handleRecurringToggle = (value: boolean) => {
    form.setValue("isRecurring", value);
    setShowRecurringOptions(value);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <TranslatedText i18nKey={editExpense ? "expense.edit_expense" : "expense.add_expense"}>
              {editExpense ? "Editar Despesa" : "Adicionar Despesa"}
            </TranslatedText>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <TranslatedText i18nKey="expense.description">Descrição</TranslatedText>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("expense.description_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <TranslatedText i18nKey="expense.amount">Valor</TranslatedText>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    <TranslatedText i18nKey="expense.date">Data</TranslatedText>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            formatDate(field.value, i18n.language)
                          ) : (
                            <span>{t("expense.select_date")}</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <TranslatedText i18nKey="expense.category">Categoria</TranslatedText>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("expense.select_category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            />
                            <TranslatedText 
                              i18nKey={`categories.${category.name.toLowerCase().replace(/\s+/g, '_')}`}
                              tag="span"
                            >
                              {category.name}
                            </TranslatedText>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isFixed"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    <TranslatedText i18nKey="expense.type">Tipo</TranslatedText>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fixed" id="expense-type-fixed" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="expense-type-fixed">
                          {t("expense.fixed")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="variable" id="expense-type-variable" />
                        </FormControl>
                        <FormLabel className="font-normal" htmlFor="expense-type-variable">
                          {t("expense.variable")}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t("expense.recurring")}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleRecurringToggle(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {showRecurringOptions && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("expense.frequency")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("expense.select_frequency")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">
                            <TranslatedText i18nKey="expense.weekly">Semanal</TranslatedText>
                          </SelectItem>
                          <SelectItem value="monthly">
                            <TranslatedText i18nKey="expense.monthly">Mensal</TranslatedText>
                          </SelectItem>
                          <SelectItem value="yearly">
                            <TranslatedText i18nKey="expense.yearly">Anual</TranslatedText>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="recurringEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("expense.end_date")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                formatDate(field.value, i18n.language)
                              ) : (
                                <span>{t("expense.select_end_date")}</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={expenseMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={expenseMutation.isPending}>
                {expenseMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
