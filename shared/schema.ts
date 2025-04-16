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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  language: true,
  theme: true,
  currency: true,
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

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  description: true,
  amount: true,
  date: true,
  categoryId: true,
  userId: true,
  isRecurring: true,
  recurringFrequency: true,
  recurringEndDate: true,
  isFixed: true,
  isPaid: true,
});

// Wallets table
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  name: true,
  balance: true,
  userId: true,
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

export const insertSavingSchema = createInsertSchema(savings).pick({
  name: true,
  targetAmount: true,
  currentAmount: true,
  userId: true,
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
