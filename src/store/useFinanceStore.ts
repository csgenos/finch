import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { encryptedStorage } from '../lib/storage/encryptedStorage';
import { Account, Transaction, Budget, Category, ProjectionAssumptions, NetWorthSnapshot } from '../types/finance';
import { Scenario } from '../types/scenario';
import { PaycheckSchedule, PaycheckAllocation, RecurringExpense } from '../types/planning';
import { Goal } from '../types/goals';
import { createLegacyStateStorage } from '../lib/storage/localStore';
import {
  sampleAccounts, sampleTransactions, sampleBudgets, sampleCategories,
} from '../data/sampleData';
import { calculateNetWorth, calculateTotalAssets, calculateTotalLiabilities } from '../lib/finance/cashflow';

interface FinanceStore {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  scenarios: Scenario[];
  assumptions: ProjectionAssumptions;
  paychecks: PaycheckSchedule[];
  allocations: PaycheckAllocation[];
  recurringExpenses: RecurringExpense[];
  goals: Goal[];
  netWorthSnapshots: NetWorthSnapshot[];

  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;

  updateAssumptions: (updates: Partial<ProjectionAssumptions>) => void;

  addPaycheck: (p: PaycheckSchedule) => void;
  updatePaycheck: (id: string, updates: Partial<PaycheckSchedule>) => void;
  deletePaycheck: (id: string) => void;

  addAllocation: (a: PaycheckAllocation) => void;
  updateAllocation: (id: string, updates: Partial<PaycheckAllocation>) => void;
  deleteAllocation: (id: string) => void;

  addRecurringExpense: (r: RecurringExpense) => void;
  updateRecurringExpense: (id: string, updates: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  markRecurringPaid: (id: string) => void;

  addGoal: (g: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addNetWorthSnapshot: (snap: NetWorthSnapshot) => void;
  captureNetWorthSnapshot: () => void;

  importFullBackup: (data: unknown) => void;
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
    (set, get) => ({
      accounts: sampleAccounts,
      transactions: sampleTransactions,
      budgets: sampleBudgets,
      categories: sampleCategories,
      scenarios: [],
      assumptions: defaultAssumptions,
      paychecks: [],
      allocations: [],
      recurringExpenses: [],
      goals: [],
      netWorthSnapshots: [],

      addAccount: (account) => set(s => ({ accounts: [...s.accounts, account] })),
      updateAccount: (id, updates) => set(s => ({
        accounts: s.accounts.map(a => a.id === id ? { ...a, ...updates } : a),
      })),
      deleteAccount: (id) => set(s => ({
        accounts: s.accounts.filter(a => a.id !== id),
        transactions: s.transactions.filter(t => t.accountId !== id),
        paychecks: s.paychecks.filter(p => p.accountId !== id),
        recurringExpenses: s.recurringExpenses.filter(r => r.accountId !== id),
      })),

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

      addPaycheck: (p) => set(s => ({ paychecks: [...s.paychecks, p] })),
      updatePaycheck: (id, updates) => set(s => ({ paychecks: s.paychecks.map(p => p.id === id ? { ...p, ...updates } : p) })),
      deletePaycheck: (id) => set(s => ({ paychecks: s.paychecks.filter(p => p.id !== id) })),

      addAllocation: (a) => set(s => ({ allocations: [...s.allocations, a] })),
      updateAllocation: (id, updates) => set(s => ({ allocations: s.allocations.map(a => a.id === id ? { ...a, ...updates } : a) })),
      deleteAllocation: (id) => set(s => ({ allocations: s.allocations.filter(a => a.id !== id) })),

      addRecurringExpense: (r) => set(s => ({ recurringExpenses: [...s.recurringExpenses, r] })),
      updateRecurringExpense: (id, updates) => set(s => ({ recurringExpenses: s.recurringExpenses.map(r => r.id === id ? { ...r, ...updates } : r) })),
      deleteRecurringExpense: (id) => set(s => ({ recurringExpenses: s.recurringExpenses.filter(r => r.id !== id) })),
      markRecurringPaid: (id) => set(s => ({
        recurringExpenses: s.recurringExpenses.map(r => {
          if (r.id !== id) return r;
          return { ...r, status: 'paid' as const };
        }),
      })),

      addGoal: (g) => set(s => ({ goals: [...s.goals, g] })),
      updateGoal: (id, updates) => set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g) })),
      deleteGoal: (id) => set(s => ({ goals: s.goals.filter(g => g.id !== id) })),

      addNetWorthSnapshot: (snap) => set(s => ({ netWorthSnapshots: [...s.netWorthSnapshots, snap] })),
      captureNetWorthSnapshot: () => {
        const { accounts, netWorthSnapshots } = get();
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const alreadyCaptured = netWorthSnapshots.some(s => s.date.startsWith(yearMonth));
        if (alreadyCaptured) return;
        const totalAssets = calculateTotalAssets(accounts);
        const totalLiabilities = calculateTotalLiabilities(accounts);
        const netWorth = calculateNetWorth(accounts);
        set(s => ({
          netWorthSnapshots: [...s.netWorthSnapshots, {
            date: now.toISOString(),
            totalAssets,
            totalLiabilities,
            netWorth,
          }],
        }));
      },

      importFullBackup: (data) => {
        if (typeof data !== 'object' || data === null) return;
        const d = data as Record<string, unknown>;
        set(s => ({
          accounts: Array.isArray(d.accounts) ? d.accounts : s.accounts,
          transactions: Array.isArray(d.transactions) ? d.transactions : s.transactions,
          budgets: Array.isArray(d.budgets) ? d.budgets : s.budgets,
          categories: Array.isArray(d.categories) ? d.categories : s.categories,
          scenarios: Array.isArray(d.scenarios) ? d.scenarios : s.scenarios,
          assumptions: (d.assumptions && typeof d.assumptions === 'object')
            ? { ...defaultAssumptions, ...(d.assumptions as object) }
            : s.assumptions,
          paychecks: Array.isArray(d.paychecks) ? d.paychecks : s.paychecks,
          allocations: Array.isArray(d.allocations) ? d.allocations : s.allocations,
          recurringExpenses: Array.isArray(d.recurringExpenses) ? d.recurringExpenses : s.recurringExpenses,
          goals: Array.isArray(d.goals) ? d.goals : s.goals,
          netWorthSnapshots: Array.isArray(d.netWorthSnapshots) ? d.netWorthSnapshots : s.netWorthSnapshots,
        }));
      },
    }),
    {
      name: 'flint-finance',
      version: 4,
      storage: createJSONStorage(() => encryptedStorage),
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<FinanceStore>;

        if (version < 4) {
          return {
            accounts: state.accounts ?? sampleAccounts,
            transactions: state.transactions ?? sampleTransactions,
            budgets: state.budgets ?? sampleBudgets,
            categories: state.categories ?? sampleCategories,
            scenarios: state.scenarios ?? [],
            assumptions: { ...defaultAssumptions, ...(state.assumptions ?? {}) },
            paychecks: state.paychecks ?? [],
            allocations: state.allocations ?? [],
            recurringExpenses: state.recurringExpenses ?? [],
            goals: state.goals ?? [],
            netWorthSnapshots: state.netWorthSnapshots ?? [],
          };
        }

        return state as FinanceStore;
      },
    }
  )
);

export function migrateLegacyFinanceData(): void {
  const legacyAdapter = createLegacyStateStorage(['finch-finance']);
  const raw = legacyAdapter.getItem('finch-finance');
  if (raw) {
    legacyAdapter.removeItem('finch-finance');
  }
}
