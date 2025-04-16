import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertCategorySchema, insertExpenseSchema, insertWalletSchema, insertBudgetSchema, insertSavingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const categories = await storage.getCategories(userId);
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const categoryData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const categoryId = parseInt(req.params.id);
      
      const category = await storage.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      if (category.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedCategory = await storage.updateCategory(categoryId, req.body);
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const categoryId = parseInt(req.params.id);
      
      const category = await storage.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      if (category.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteCategory(categoryId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const expenses = await storage.getExpenses(userId);
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const expenseData = insertExpenseSchema.parse({ ...req.body, userId });
      
      // Validate category belongs to user
      const category = await storage.getCategoryById(expenseData.categoryId);
      if (!category || category.userId !== userId) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const expenseId = parseInt(req.params.id);
      
      const expense = await storage.getExpenseById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      if (expense.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // If updating category, validate it belongs to user
      if (req.body.categoryId) {
        const category = await storage.getCategoryById(req.body.categoryId);
        if (!category || category.userId !== userId) {
          return res.status(400).json({ message: "Invalid category" });
        }
      }
      
      const updatedExpense = await storage.updateExpense(expenseId, req.body);
      res.json(updatedExpense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const expenseId = parseInt(req.params.id);
      
      const expense = await storage.getExpenseById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      if (expense.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteExpense(expenseId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Wallets routes
  app.get("/api/wallets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const wallets = await storage.getWallets(userId);
    res.json(wallets);
  });

  app.post("/api/wallets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const walletData = insertWalletSchema.parse({ ...req.body, userId });
      const wallet = await storage.createWallet(walletData);
      res.status(201).json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create wallet" });
    }
  });

  app.put("/api/wallets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const walletId = parseInt(req.params.id);
      
      const wallet = await storage.getWalletById(walletId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      if (wallet.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedWallet = await storage.updateWallet(walletId, req.body);
      res.json(updatedWallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to update wallet" });
    }
  });

  app.delete("/api/wallets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const walletId = parseInt(req.params.id);
      
      const wallet = await storage.getWalletById(walletId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      if (wallet.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteWallet(walletId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete wallet" });
    }
  });

  // Budgets routes
  app.get("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const budgets = await storage.getBudgets(userId);
    res.json(budgets);
  });

  app.get("/api/budgets/current", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const today = new Date();
    const month = today.getMonth() + 1; // JavaScript months are 0-indexed
    const year = today.getFullYear();
    
    const budget = await storage.getBudgetByMonthYear(userId, month, year);
    if (!budget) {
      return res.status(404).json({ message: "No budget for current month" });
    }
    
    res.json(budget);
  });

  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      // Valide os dados usando o schema modificado
      // O schema agora vai transformar amount para number automaticamente
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if budget already exists for this month/year
      const existingBudget = await storage.getBudgetByMonthYear(userId, budgetData.month, budgetData.year);
      if (existingBudget) {
        return res.status(400).json({ message: "Budget already exists for this month" });
      }
      
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Budget creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const budgetId = parseInt(req.params.id);
      
      const budget = await storage.getBudgetById(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Valide e transforme apenas os campos que estão sendo atualizados
      // Cria um schema parcial
      const partialBudgetSchema = z.object({
        amount: z.union([z.string(), z.number()]).optional()
          .transform(val => val !== undefined && typeof val === 'string' ? parseFloat(val) : val),
        month: z.number().optional(),
        year: z.number().optional(),
      });
      
      // Valida e transforma automaticamente os tipos
      const updateData = partialBudgetSchema.parse(req.body);
      
      const updatedBudget = await storage.updateBudget(budgetId, updateData);
      res.json(updatedBudget);
    } catch (error) {
      console.error("Budget update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  // Savings routes
  app.get("/api/savings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const savings = await storage.getSavings(userId);
    res.json(savings);
  });

  app.post("/api/savings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const savingData = insertSavingSchema.parse({ ...req.body, userId });
      const saving = await storage.createSaving(savingData);
      res.status(201).json(saving);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create saving" });
    }
  });

  app.put("/api/savings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const savingId = parseInt(req.params.id);
      
      const saving = await storage.getSavingById(savingId);
      if (!saving) {
        return res.status(404).json({ message: "Saving not found" });
      }
      
      if (saving.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedSaving = await storage.updateSaving(savingId, req.body);
      res.json(updatedSaving);
    } catch (error) {
      res.status(500).json({ message: "Failed to update saving" });
    }
  });

  app.delete("/api/savings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const savingId = parseInt(req.params.id);
      
      const saving = await storage.getSavingById(savingId);
      if (!saving) {
        return res.status(404).json({ message: "Saving not found" });
      }
      
      if (saving.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteSaving(savingId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete saving" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
