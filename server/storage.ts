import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import session, { MemoryStore } from "express-session";
import type { Request } from "express";

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  userId: number;
  createdAt: Date;
}

export interface InsertCategory {
  name: string;
  color: string;
  userId: number;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  categoryId: number;
  userId: number;
  date: Date;
  createdAt: Date;
}

export interface InsertExpense {
  amount: number;
  description: string;
  categoryId: number;
  userId: number;
  date: Date;
}

export interface Wallet {
  id: number;
  name: string;
  balance: number;
  userId: number;
  createdAt: Date;
}

export interface InsertWallet {
  name: string;
  balance: number;
  userId: number;
}

export interface Budget {
  id: number;
  amount: number;
  month: number;
  year: number;
  userId: number;
  createdAt: Date;
}

export interface InsertBudget {
  amount: number;
  month: number;
  year: number;
  userId: number;
}

export interface Saving {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  userId: number;
  createdAt: Date;
}

export interface InsertSaving {
  name: string;
  targetAmount: number;
  currentAmount: number;
  userId: number;
}

// Storage interface
export interface IStorage {
  sessionStore: any;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Category methods
  getCategories(userId: number): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(insertCategory: InsertCategory): Promise<Category>;
  updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Expense methods
  getExpenses(userId: number): Promise<Expense[]>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  createExpense(insertExpense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Wallet methods
  getWallets(userId: number): Promise<Wallet[]>;
  getWalletById(id: number): Promise<Wallet | undefined>;
  createWallet(insertWallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, walletData: Partial<Wallet>): Promise<Wallet | undefined>;
  deleteWallet(id: number): Promise<boolean>;

  // Budget methods
  getBudgets(userId: number): Promise<Budget[]>;
  getBudgetById(id: number): Promise<Budget | undefined>;
  getBudgetByMonthYear(userId: number, month: number, year: number): Promise<Budget | undefined>;
  createBudget(insertBudget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budgetData: Partial<Budget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;

  // Saving methods
  getSavings(userId: number): Promise<Saving[]>;
  getSavingById(id: number): Promise<Saving | undefined>;
  createSaving(insertSaving: InsertSaving): Promise<Saving>;
  updateSaving(id: number, savingData: Partial<Saving>): Promise<Saving | undefined>;
  deleteSaving(id: number): Promise<boolean>;
}

// Memory Storage Implementation WITH FILE PERSISTENCE
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
  sessionStore: any;

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

    // Carregar dados persistentes do arquivo
    this.loadDataFromFile().catch(console.error);

    // Corrigir o tipo do MemoryStore
    this.sessionStore = new (MemoryStore as any)({
      checkPeriod: 86400000
    });

    console.log("Usando armazenamento PERSISTENTE em arquivo (database.json)");
  }

  // Método para carregar dados do arquivo
  private async loadDataFromFile() {
    try {
      const fs = await import('fs');
      if (fs.existsSync('./database.json')) {
        const data = JSON.parse(fs.readFileSync('./database.json', 'utf8'));

        // Restaurar dados
        if (data.users) {
          this.users = new Map(data.users.map((item: any) => [
            item[0],
            { ...item[1], createdAt: new Date(item[1].createdAt) }
          ]));
        }
        if (data.categories) {
          this.categories = new Map(data.categories.map((item: any) => [
            item[0],
            { ...item[1], createdAt: new Date(item[1].createdAt) }
          ]));
        }
        if (data.expenses) {
          this.expenses = new Map(data.expenses.map((item: any) => [
            item[0],
            {
              ...item[1],
              date: new Date(item[1].date),
              createdAt: new Date(item[1].createdAt)
            }
          ]));
        }
        if (data.wallets) {
          this.wallets = new Map(data.wallets.map((item: any) => [
            item[0],
            { ...item[1], createdAt: new Date(item[1].createdAt) }
          ]));
        }
        if (data.budgets) {
          this.budgets = new Map(data.budgets.map((item: any) => [
            item[0],
            { ...item[1], createdAt: new Date(item[1].createdAt) }
          ]));
        }
        if (data.savings) {
          this.savings = new Map(data.savings.map((item: any) => [
            item[0],
            { ...item[1], createdAt: new Date(item[1].createdAt) }
          ]));
        }
        if (data.currentIds) {
          this.currentIds = data.currentIds;
        }

        console.log(`Dados carregados: ${this.users.size} usuários, ${this.categories.size} categorias, ${this.expenses.size} despesas`);
      } else {
        console.log("Arquivo database.json não encontrado. Iniciando com dados vazios.");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      console.log("Iniciando com dados vazios");
    }
  }

  // Método para salvar dados no arquivo
  private async saveDataToFile() {
    try {
      const fs = await import('fs');
      const data = {
        users: Array.from(this.users.entries()),
        categories: Array.from(this.categories.entries()),
        expenses: Array.from(this.expenses.entries()),
        wallets: Array.from(this.wallets.entries()),
        budgets: Array.from(this.budgets.entries()),
        savings: Array.from(this.savings.entries()),
        currentIds: this.currentIds
      };

      fs.writeFileSync('./database.json', JSON.stringify(data, null, 2));
      console.log("Dados salvos em database.json");
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    await this.saveDataToFile(); // SALVAR DADOS
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    await this.saveDataToFile(); // SALVAR DADOS
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = this.users.delete(id);
    if (result) {
      await this.saveDataToFile(); // SALVAR DADOS
    }
    return result;
  }

  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(category => category.userId === userId);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentIds.categories++;
    const now = new Date();
    const category: Category = { ...insertCategory, id, createdAt: now };
    this.categories.set(id, category);
    await this.saveDataToFile(); // SALVAR DADOS
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    await this.saveDataToFile(); // SALVAR DADOS
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = this.categories.delete(id);
    if (result) {
      await this.saveDataToFile(); // SALVAR DADOS
    }
    return result;
  }

  // Expense methods
  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.userId === userId);
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentIds.expenses++;
    const now = new Date();
    const expense: Expense = { ...insertExpense, id, createdAt: now };
    this.expenses.set(id, expense);
    await this.saveDataToFile(); // SALVAR DADOS
    return expense;
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;

    const updatedExpense = { ...expense, ...expenseData };
    this.expenses.set(id, updatedExpense);
    await this.saveDataToFile(); // SALVAR DADOS
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = this.expenses.delete(id);
    if (result) {
      await this.saveDataToFile(); // SALVAR DADOS
    }
    return result;
  }

  // Wallet methods
  async getWallets(userId: number): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter(wallet => wallet.userId === userId);
  }

  async getWalletById(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.currentIds.wallets++;
    const now = new Date();
    const wallet: Wallet = { ...insertWallet, id, createdAt: now };
    this.wallets.set(id, wallet);
    await this.saveDataToFile(); // SALVAR DADOS
    return wallet;
  }

  async updateWallet(id: number, walletData: Partial<Wallet>): Promise<Wallet | undefined> {
    const wallet = this.wallets.get(id);
    if (!wallet) return undefined;

    const updatedWallet = { ...wallet, ...walletData };
    this.wallets.set(id, updatedWallet);
    await this.saveDataToFile(); // SALVAR DADOS
    return updatedWallet;
  }

  async deleteWallet(id: number): Promise<boolean> {
    const result = this.wallets.delete(id);
    if (result) {
      await this.saveDataToFile(); // SALVAR DADOS
    }
    return result;
  }

  // Budget methods
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(budget => budget.userId === userId);
  }

  async getBudgetById(id: number): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async getBudgetByMonthYear(userId: number, month: number, year: number): Promise<Budget | undefined> {
    for (const budget of Array.from(this.budgets.values())) {
      if (budget.userId === userId && budget.month === month && budget.year === year) {
        return budget;
      }
    }
    return undefined;
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.currentIds.budgets++;
    const now = new Date();
    const budget: Budget = { ...insertBudget, id, createdAt: now };
    this.budgets.set(id, budget);
    await this.saveDataToFile(); // SALVAR DADOS
    return budget;
  }

  async updateBudget(id: number, budgetData: Partial<Budget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;

    const updatedBudget = { ...budget, ...budgetData };
    this.budgets.set(id, updatedBudget);
    await this.saveDataToFile(); // SALVAR DADOS
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = this.budgets.delete(id);
    if (result) {
      await this.saveDataToFile(); // SALVAR DADOS
    }
    return result;
  }

  // Saving methods
  async getSavings(userId: number): Promise<Saving[]> {
    return Array.from(this.savings.values()).filter(saving => saving.userId === userId);
  }

  async getSavingById(id: number): Promise<Saving | undefined> {
    return this.savings.get(id);
  }

  async createSaving(insertSaving: InsertSaving): Promise<Saving> {
    const id = this.currentIds.savings++;
    const now = new Date();
    const saving: Saving = { ...insertSaving, id, createdAt: now };
    this.savings.set(id, saving);
    await this.saveDataToFile(); // SALVAR DADOS
    return saving;
  }

  async updateSaving(id: number, savingData: Partial<Saving>): Promise<Saving | undefined> {
    const saving = this.savings.get(id);
    if (!saving) return undefined;

    const updatedSaving = { ...saving, ...savingData };
    this.savings.set(id, updatedSaving);
    await this.saveDataToFile(); // SALVAR DADOS
    return updatedSaving;
  }

  async deleteSaving(id: number): Promise<boolean> {
    const result = this.savings.delete(id);
    if (result) {
      await this.saveDataToFile(); // SALVAR DADOS
    }
    return result;
  }
}

// Export the storage instance with file persistence
export default new MemStorage();
