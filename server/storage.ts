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

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
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
  
  // Session store
  sessionStore: session.SessionStore;
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
  
  sessionStore: session.SessionStore;

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

export const storage = new MemStorage();
