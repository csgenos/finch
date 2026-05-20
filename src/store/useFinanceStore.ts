import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, Transaction, Budget, Category, ProjectionAssumptions } from '../types/finance';
import { Scenario } from '../types/scenario';
import {
  sampleAccounts, sampleTransactions, sampleBudgets, sampleCategories,
} from '../data/sampleData';

interface FinanceStore {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  scenarios: Scenario[];
  assumptions: ProjectionAssumptions;

  // Accounts
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Transactions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Budgets
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Categories
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Scenarios
  addScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;

  // Assumptions
  updateAssumptions: (updates: Partial<ProjectionAssumptions>) => void;
}

const defaultAssumptions: ProjectionAssumptions = {
  annualIncomeGrowth: 0.04,
  annualExpenseGrowth: 0.03,
  annualInflation: 0.035,
  annualInvestmentReturn: 0.07,
  targetSavingsRate: 0.20,
  retirementAge: 65,
  currentAge: 32,
};

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      accounts: sampleAccounts,
      transactions: sampleTransactions,
      budgets: sampleBudgets,
      categories: sampleCategories,
      scenarios: [],
      assumptions: defaultAssumptions,

      addAccount: (account) => set(s => ({ accounts: [...s.accounts, account] })),
      updateAccount: (id, updates) => set(s => ({
        accounts: s.accounts.map(a => a.id === id ? { ...a, ...updates } : a),
      })),
      deleteAccount: (id) => set(s => ({ accounts: s.accounts.filter(a => a.id !== id) })),

      addTransaction: (transaction) => set(s => ({ transactions: [transaction, ...s.transactions] })),
      updateTransaction: (id, updates) => set(s => ({
        transactions: s.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      deleteTransaction: (id) => set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),

      addBudget: (budget) => set(s => ({ budgets: [...s.budgets, budget] })),
      updateBudget: (id, updates) => set(s => ({
        budgets: s.budgets.map(b => b.id === id ? { ...b, ...updates } : b),
      })),
      deleteBudget: (id) => set(s => ({ budgets: s.budgets.filter(b => b.id !== id) })),

      addCategory: (category) => set(s => ({ categories: [...s.categories, category] })),
      updateCategory: (id, updates) => set(s => ({
        categories: s.categories.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
      deleteCategory: (id) => set(s => ({ categories: s.categories.filter(c => c.id !== id) })),

      addScenario: (scenario) => set(s => ({ scenarios: [...s.scenarios, scenario] })),
      updateScenario: (id, updates) => set(s => ({
        scenarios: s.scenarios.map(sc => sc.id === id ? { ...sc, ...updates } : sc),
      })),
      deleteScenario: (id) => set(s => ({ scenarios: s.scenarios.filter(sc => sc.id !== id) })),

      updateAssumptions: (updates) => set(s => ({ assumptions: { ...s.assumptions, ...updates } })),
    }),
    { name: 'finch-finance' }
  )
);
