import { pgTable, text, serial, integer, boolean, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  language: text("language").default("en").notNull(),
  theme: text("theme").default("light").notNull(),
  currency: text("currency").default("BRL").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationCode: text("verification_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const baseUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  language: true,
  theme: true,
  currency: true,
});

export const insertUserSchema = baseUserSchema.extend({
  username: z.string()
    .min(5, "Email deve ter pelo menos 5 caracteres")
    .email("Formato de email inválido")
    .refine(email => {
      // Validação adicional para garantir que o email tenha um formato válido
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      return emailRegex.test(email);
    }, "Formato de email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  color: true,
  icon: true,
  userId: true,
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  categoryId: integer("category_id").notNull(),
  userId: integer("user_id").notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringFrequency: text("recurring_frequency"),
  recurringEndDate: date("recurring_end_date"),
  isFixed: boolean("is_fixed").default(true).notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Criamos um schema base para despesas
const baseExpenseSchema = createInsertSchema(expenses).pick({
  description: true,
  date: true,
  categoryId: true,
  userId: true,
  isRecurring: true,
  recurringFrequency: true,
  recurringEndDate: true,
  isFixed: true,
  isPaid: true,
});

// Modificamos o schema de inserção para aceitar tanto string quanto number para o campo amount
export const insertExpenseSchema = baseExpenseSchema.extend({
  // Utiliza o union para aceitar tanto string quanto number
  amount: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
});

// Wallets table
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema base para carteiras
const baseWalletSchema = createInsertSchema(wallets).pick({
  name: true,
  userId: true,
});

// Modifica o schema para aceitar tanto string quanto number para o campo balance
export const insertWalletSchema = baseWalletSchema.extend({
  balance: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cria o schema básico e depois modifica para permitir tipos corretos
const baseBudgetSchema = createInsertSchema(budgets);

// Modifica o schema de inserção para aceitar tanto string quanto number para o campo amount
export const insertBudgetSchema = baseBudgetSchema.pick({
  month: true,
  year: true,
  userId: true,
}).extend({
  // Utiliza o .or() para aceitar tanto string quanto number
  amount: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
});

// Savings table
export const savings = pgTable("savings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema base para economias
const baseSavingSchema = createInsertSchema(savings).pick({
  name: true,
  userId: true,
});

// Modifica o schema para aceitar tanto string quanto number para os campos de valores
export const insertSavingSchema = baseSavingSchema.extend({
  targetAmount: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
  currentAmount: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseFloat(val) : val),
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export type InsertSaving = z.infer<typeof insertSavingSchema>;
export type Saving = typeof savings.$inferSelect;
