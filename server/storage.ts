import { users, categories, expenses, wallets, budgets, savings } from "@shared/schema";
import type {
  User, InsertUser,
  Category, InsertCategory,
  Expense, InsertExpense,
  Wallet, InsertWallet,
  Budget, InsertBudget,
  Saving, InsertSaving
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// ADICIONE ESTAS LINHAS PARA CORRIGIR OS ERROS:

// Se drizzle-orm der erro, descomente as linhas abaixo:
let drizzle: any, neon: any, eq: any, and: any, connectPg: any;

try {
  ({ drizzle } = require("drizzle-orm/neon-http"));
  ({ neon } = require("@neondatabase/serverless"));
  ({ eq, and } = require("drizzle-orm"));
  connectPg = require("connect-pg-simple");
} catch (error) {
  console.log("Dependências PostgreSQL não encontradas, usando apenas MemStorage");
  // Funções dummy para evitar erros
  drizzle = () => null;
  neon = () => null;
  eq = () => null;
  and = () => null;
  connectPg = () => null;
}

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: any;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Category operations
  getCategories(userId: number): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Expense operations
  getExpenses(userId: number): Promise<Expense[]>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Wallet operations
  getWallets(userId: number): Promise<Wallet[]>;
  getWalletById(id: number): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, wallet: Partial<Wallet>): Promise<Wallet | undefined>;
  deleteWallet(id: number): Promise<boolean>;

  // Budget operations
  getBudgets(userId: number): Promise<Budget[]>;
  getBudgetById(id: number): Promise<Budget | undefined>;
  getBudgetByMonthYear(userId: number, month: number, year: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<Budget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;

  // Saving operations
  getSavings(userId: number): Promise<Saving[]>;
  getSavingById(id: number): Promise<Saving | undefined>;
  createSaving(saving: InsertSaving): Promise<Saving>;
  updateSaving(id: number, saving: Partial<Saving>): Promise<Saving | undefined>;
  deleteSaving(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private expenses: Map<number, Expense>;
  private wallets: Map<number, Wallet>;
  private budgets: Map<number, Budget>;
  private savings: Map<number, Saving>;
  private currentIds: {
    users: number;
    categories: number;
    expenses: number;
    wallets: number;
    budgets: number;
    savings: number;
  };

  sessionStore: any; // Required for session management

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.expenses = new Map();
    this.wallets = new Map();
    this.budgets = new Map();
    this.savings = new Map();

    this.currentIds = {
      users: 1,
      categories: 1,
      expenses: 1,
      wallets: 1,
      budgets: 1,
      savings: 1
    };

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;

    // Remove o usuário
    this.users.delete(id);

    // Remove todos os dados associados ao usuário
    // 1. Remover categorias do usuário
    const userCategories = await this.getCategories(id);
    for (const category of userCategories) {
      await this.deleteCategory(category.id);
    }

    // 2. Remover despesas do usuário
    const userExpenses = await this.getExpenses(id);
    for (const expense of userExpenses) {
      await this.deleteExpense(expense.id);
    }

    // 3. Remover carteiras do usuário
    const userWallets = await this.getWallets(id);
    for (const wallet of userWallets) {
      await this.deleteWallet(wallet.id);
    }

    // 4. Remover orçamentos do usuário
    const userBudgets = await this.getBudgets(id);
    for (const budget of userBudgets) {
      await this.deleteBudget(budget.id);
    }

    // 5. Remover metas de poupança do usuário
    const userSavings = await this.getSavings(id);
    for (const saving of userSavings) {
      await this.deleteSaving(saving.id);
    }

    return true;
  }

  // Category operations
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.userId === userId
    );
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentIds.categories++;
    const now = new Date();
    const category: Category = { ...insertCategory, id, createdAt: now };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = await this.getCategoryById(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Expense operations
  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId
    );
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentIds.expenses++;
    const now = new Date();
    const expense: Expense = { ...insertExpense, id, createdAt: now };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined> {
    const expense = await this.getExpenseById(id);
    if (!expense) return undefined;

    const updatedExpense = { ...expense, ...expenseData };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Wallet operations
  async getWallets(userId: number): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter(
      (wallet) => wallet.userId === userId
    );
  }

  async getWalletById(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.currentIds.wallets++;
    const now = new Date();
    const wallet: Wallet = { ...insertWallet, id, createdAt: now };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async updateWallet(id: number, walletData: Partial<Wallet>): Promise<Wallet | undefined> {
    const wallet = await this.getWalletById(id);
    if (!wallet) return undefined;

    const updatedWallet = { ...wallet, ...walletData };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }

  async deleteWallet(id: number): Promise<boolean> {
    return this.wallets.delete(id);
  }

  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(
      (budget) => budget.userId === userId
    );
  }

  async getBudgetById(id: number): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async getBudgetByMonthYear(userId: number, month: number, year: number): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(
      (budget) => budget.userId === userId && budget.month === month && budget.year === year
    );
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.currentIds.budgets++;
    const now = new Date();
    const budget: Budget = { ...insertBudget, id, createdAt: now };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: number, budgetData: Partial<Budget>): Promise<Budget | undefined> {
    const budget = await this.getBudgetById(id);
    if (!budget) return undefined;

    const updatedBudget = { ...budget, ...budgetData };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }

  // Saving operations
  async getSavings(userId: number): Promise<Saving[]> {
    return Array.from(this.savings.values()).filter(
      (saving) => saving.userId === userId
    );
  }

  async getSavingById(id: number): Promise<Saving | undefined> {
    return this.savings.get(id);
  }

  async createSaving(insertSaving: InsertSaving): Promise<Saving> {
    const id = this.currentIds.savings++;
    const now = new Date();
    const saving: Saving = { ...insertSaving, id, createdAt: now };
    this.savings.set(id, saving);
    return saving;
  }

  async updateSaving(id: number, savingData: Partial<Saving>): Promise<Saving | undefined> {
    const saving = await this.getSavingById(id);
    if (!saving) return undefined;

    const updatedSaving = { ...saving, ...savingData };
    this.savings.set(id, updatedSaving);
    return updatedSaving;
  }

  async deleteSaving(id: number): Promise<boolean> {
    return this.savings.delete(id);
  }
}

// PostgreSQL Database Storage Implementation
export class DatabaseStorage implements IStorage {
  private db: any;
  sessionStore: any;

  constructor() {
    // CORREÇÃO PRINCIPAL: Verificar se DATABASE_URL existe ou usar memória
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.log("DATABASE_URL não encontrada, usando armazenamento em memória");
      // Se não tiver DATABASE_URL, usar MemStorage
      throw new Error("DATABASE_URL required for PostgreSQL. Use MemStorage instead.");
    }

    const sql = neon(databaseUrl);
    this.db = drizzle(sql);

    // Configure PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conString: databaseUrl,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Category operations
  async getCategories(userId: number): Promise<Category[]> {
    return await this.db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const result = await this.db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await this.db.insert(categories).values(insertCategory).returning();
    return result[0];
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const result = await this.db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await this.db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Expense operations
  async getExpenses(userId: number): Promise<Expense[]> {
    return await this.db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    const result = await this.db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const result = await this.db.insert(expenses).values(insertExpense).returning();
    return result[0];
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined> {
    const result = await this.db
      .update(expenses)
      .set(expenseData)
      .where(eq(expenses.id, id))
      .returning();
    return result[0];
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await this.db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Wallet operations
  async getWallets(userId: number): Promise<Wallet[]> {
    return await this.db.select().from(wallets).where(eq(wallets.userId, userId));
  }

  async getWalletById(id: number): Promise<Wallet | undefined> {
    const result = await this.db.select().from(wallets).where(eq(wallets.id, id));
    return result[0];
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const result = await this.db.insert(wallets).values(insertWallet).returning();
    return result[0];
  }

  async updateWallet(id: number, walletData: Partial<Wallet>): Promise<Wallet | undefined> {
    const result = await this.db
      .update(wallets)
      .set(walletData)
      .where(eq(wallets.id, id))
      .returning();
    return result[0];
  }

  async deleteWallet(id: number): Promise<boolean> {
    const result = await this.db.delete(wallets).where(eq(wallets.id, id)).returning();
    return result.length > 0;
  }

  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    return await this.db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async getBudgetById(id: number): Promise<Budget | undefined> {
    const result = await this.db.select().from(budgets).where(eq(budgets.id, id));
    return result[0];
  }

  async getBudgetByMonthYear(userId: number, month: number, year: number): Promise<Budget | undefined> {
    const result = await this.db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.month, month),
          eq(budgets.year, year)
        )
      );
    return result[0];
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const result = await this.db.insert(budgets).values(insertBudget).returning();
    return result[0];
  }

  async updateBudget(id: number, budgetData: Partial<Budget>): Promise<Budget | undefined> {
    const result = await this.db
      .update(budgets)
      .set(budgetData)
      .where(eq(budgets.id, id))
      .returning();
    return result[0];
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = await this.db.delete(budgets).where(eq(budgets.id, id)).returning();
    return result.length > 0;
  }

  // Saving operations
  async getSavings(userId: number): Promise<Saving[]> {
    return await this.db.select().from(savings).where(eq(savings.userId, userId));
  }

  async getSavingById(id: number): Promise<Saving | undefined> {
    const result = await this.db.select().from(savings).where(eq(savings.id, id));
    return result[0];
  }

  async createSaving(insertSaving: InsertSaving): Promise<Saving> {
    const result = await this.db.insert(savings).values(insertSaving).returning();
    return result[0];
  }

  async updateSaving(id: number, savingData: Partial<Saving>): Promise<Saving | undefined> {
    const result = await this.db
      .update(savings)
      .set(savingData)
      .where(eq(savings.id, id))
      .returning();
    return result[0];
  }

  async deleteSaving(id: number): Promise<boolean> {
    const result = await this.db.delete(savings).where(eq(savings.id, id)).returning();
    return result.length > 0;
  }
}

// Factory function to create storage instance
export function createStorage(): IStorage {
  // Se não tiver DATABASE_URL, usar memória
  if (!process.env.DATABASE_URL) {
    console.log("Usando armazenamento em memória (MemStorage)");
    return new MemStorage();
  }

  try {
    console.log("Tentando usar PostgreSQL com DATABASE_URL");
    return new DatabaseStorage();
  } catch (error) {
    console.log("Erro ao conectar PostgreSQL, usando memória:", error);
    return new MemStorage();
  }
}

// Export default storage instance
export default createStorage();