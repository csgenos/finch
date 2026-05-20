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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFiniteAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);

function sanitizeAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

function signedTransactionAmount(transaction: Transaction): number {
  return transaction.type === 'income' ? transaction.amount : -transaction.amount;
}

function applyAccountDelta(accounts: Account[], accountId: string, delta: number): Account[] {
  if (!accountId || delta === 0) return accounts;
  return accounts.map(account =>
    account.id === accountId
      ? { ...account, balance: sanitizeAmount(account.balance + delta), lastUpdated: new Date().toISOString() }
      : account
  );
}

function sanitizeArray<T>(value: unknown, guard: (item: unknown) => item is T): T[] | null {
  if (!Array.isArray(value)) return null;
  return value.every(guard) ? value : null;
}

function isAccount(value: unknown): value is Account {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    isFiniteAmount(value.balance) &&
    typeof value.currency === 'string' &&
    typeof value.lastUpdated === 'string';
}

function isTransaction(value: unknown): value is Transaction {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    isIsoDate(value.date) &&
    isFiniteAmount(value.amount) &&
    value.amount >= 0 &&
    (value.type === 'income' || value.type === 'expense') &&
    typeof value.categoryId === 'string' &&
    typeof value.accountId === 'string' &&
    typeof value.description === 'string';
}

function isBudget(value: unknown): value is Budget {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.categoryId === 'string' &&
    isFiniteAmount(value.amount) &&
    value.amount >= 0 &&
    (value.period === 'monthly' || value.period === 'yearly') &&
    Number.isInteger(value.year) &&
    (value.month === undefined || Number.isInteger(value.month));
}

function isCategory(value: unknown): value is Category {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.icon === 'string' &&
    typeof value.color === 'string' &&
    (value.type === 'income' || value.type === 'expense');
}

function isAssumptions(value: unknown): value is Partial<ProjectionAssumptions> {
  if (!isRecord(value)) return false;
  return Object.values(value).every(v => typeof v === 'number' && Number.isFinite(v));
}

function isBasicEntity(value: unknown): value is { id: string } {
  return isRecord(value) && typeof value.id === 'string';
}

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

      addTransaction: (transaction) => set(s => ({
        accounts: applyAccountDelta(s.accounts, transaction.accountId, signedTransactionAmount(transaction)),
        transactions: [{ ...transaction, amount: sanitizeAmount(transaction.amount) }, ...s.transactions],
      })),
      updateTransaction: (id, updates) => set(s => {
        const existing = s.transactions.find(t => t.id === id);
        if (!existing) return {};
        const updated = { ...existing, ...updates };
        const reversed = applyAccountDelta(s.accounts, existing.accountId, -signedTransactionAmount(existing));
        const accounts = applyAccountDelta(reversed, updated.accountId, signedTransactionAmount(updated));
        return {
          accounts,
          transactions: s.transactions.map(t => t.id === id ? { ...updated, amount: sanitizeAmount(updated.amount) } : t),
        };
      }),
      deleteTransaction: (id) => set(s => {
        const existing = s.transactions.find(t => t.id === id);
        return {
          accounts: existing ? applyAccountDelta(s.accounts, existing.accountId, -signedTransactionAmount(existing)) : s.accounts,
          transactions: s.transactions.filter(t => t.id !== id),
        };
      }),

      addBudget: (budget) => set(s => ({ budgets: [...s.budgets, budget] })),
      updateBudget: (id, updates) => set(s => ({
        budgets: s.budgets.map(b => b.id === id ? { ...b, ...updates } : b),
      })),
      deleteBudget: (id) => set(s => ({ budgets: s.budgets.filter(b => b.id !== id) })),

      addCategory: (category) => set(s => ({ categories: [...s.categories, category] })),
      updateCategory: (id, updates) => set(s => ({
        categories: s.categories.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
      deleteCategory: (id) => set(s => {
        const referenced = s.transactions.some(t => t.categoryId === id) || s.budgets.some(b => b.categoryId === id);
        if (referenced) return {};
        return { categories: s.categories.filter(c => c.id !== id) };
      }),

      addScenario: (scenario) => set(s => ({ scenarios: [...s.scenarios, scenario] })),
      updateScenario: (id, updates) => set(s => ({
        scenarios: s.scenarios.map(sc => sc.id === id ? { ...sc, ...updates } : sc),
      })),
      deleteScenario: (id) => set(s => ({ scenarios: s.scenarios.filter(sc => sc.id !== id) })),

      updateAssumptions: (updates) => set(s => ({ assumptions: { ...s.assumptions, ...updates } })),

      addPaycheck: (p) => set(s => ({ paychecks: [...s.paychecks, p] })),
      updatePaycheck: (id, updates) => set(s => ({ paychecks: s.paychecks.map(p => p.id === id ? { ...p, ...updates } : p) })),
      deletePaycheck: (id) => set(s => ({
        paychecks: s.paychecks.filter(p => p.id !== id),
        allocations: s.allocations.filter(a => a.paycheckId !== id),
      })),

      addAllocation: (a) => set(s => ({ allocations: [...s.allocations, a] })),
      updateAllocation: (id, updates) => set(s => ({ allocations: s.allocations.map(a => a.id === id ? { ...a, ...updates } : a) })),
      deleteAllocation: (id) => set(s => ({ allocations: s.allocations.filter(a => a.id !== id) })),

      addRecurringExpense: (r) => set(s => ({ recurringExpenses: [...s.recurringExpenses, r] })),
      updateRecurringExpense: (id, updates) => set(s => ({ recurringExpenses: s.recurringExpenses.map(r => r.id === id ? { ...r, ...updates } : r) })),
      deleteRecurringExpense: (id) => set(s => ({ recurringExpenses: s.recurringExpenses.filter(r => r.id !== id) })),
      markRecurringPaid: (id) => set(s => ({
        recurringExpenses: s.recurringExpenses.map(r => {
          if (r.id !== id) return r;
          const current = new Date(`${r.nextDueDate}T00:00:00`);
          const next = new Date(current);
          if (r.recurrence === 'weekly') next.setDate(next.getDate() + 7);
          else if (r.recurrence === 'biweekly') next.setDate(next.getDate() + 14);
          else if (r.recurrence === 'semimonthly') {
            if (next.getDate() < 15) next.setDate(15);
            else {
              next.setMonth(next.getMonth() + 1);
              next.setDate(1);
            }
          }
          else if (r.recurrence === 'quarterly') next.setMonth(next.getMonth() + 3);
          else if (r.recurrence === 'yearly') next.setFullYear(next.getFullYear() + 1);
          else next.setMonth(next.getMonth() + 1);
          return { ...r, status: 'upcoming' as const, nextDueDate: next.toISOString().slice(0, 10) };
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
          accounts: sanitizeArray(d.accounts, isAccount) ?? s.accounts,
          transactions: sanitizeArray(d.transactions, isTransaction) ?? s.transactions,
          budgets: sanitizeArray(d.budgets, isBudget) ?? s.budgets,
          categories: sanitizeArray(d.categories, isCategory) ?? s.categories,
          scenarios: sanitizeArray(d.scenarios, isBasicEntity) as Scenario[] | null ?? s.scenarios,
          assumptions: isAssumptions(d.assumptions)
            ? { ...defaultAssumptions, ...(d.assumptions as object) }
            : s.assumptions,
          paychecks: sanitizeArray(d.paychecks, isBasicEntity) as PaycheckSchedule[] | null ?? s.paychecks,
          allocations: sanitizeArray(d.allocations, isBasicEntity) as PaycheckAllocation[] | null ?? s.allocations,
          recurringExpenses: sanitizeArray(d.recurringExpenses, isBasicEntity) as RecurringExpense[] | null ?? s.recurringExpenses,
          goals: sanitizeArray(d.goals, isBasicEntity) as Goal[] | null ?? s.goals,
          netWorthSnapshots: sanitizeArray(d.netWorthSnapshots, isBasicEntity) as NetWorthSnapshot[] | null ?? s.netWorthSnapshots,
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
