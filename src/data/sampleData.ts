import { format, subDays, subMonths } from 'date-fns';
import { Account, Budget, Category, NetWorthSnapshot, Transaction } from '../types/finance';

export const sampleAccounts: Account[] = [
  { id: 'acc-1', name: 'Chase Checking', type: 'checking', balance: 12450.33, currency: 'USD', institution: 'Chase', lastUpdated: new Date().toISOString() },
  { id: 'acc-2', name: 'Marcus Savings', type: 'savings', balance: 28750.00, currency: 'USD', institution: 'Marcus by Goldman Sachs', lastUpdated: new Date().toISOString() },
  { id: 'acc-3', name: 'Fidelity Brokerage', type: 'investment', balance: 84230.50, currency: 'USD', institution: 'Fidelity', lastUpdated: new Date().toISOString() },
  { id: 'acc-4', name: 'Fidelity 401(k)', type: 'retirement', balance: 142800.00, currency: 'USD', institution: 'Fidelity', lastUpdated: new Date().toISOString() },
  { id: 'acc-5', name: 'Chase Sapphire', type: 'credit', balance: -3240.18, currency: 'USD', institution: 'Chase', lastUpdated: new Date().toISOString() },
  { id: 'acc-6', name: 'Student Loan', type: 'loan', balance: -18500.00, currency: 'USD', institution: 'Navient', lastUpdated: new Date().toISOString() },
];

export const sampleCategories: Category[] = [
  { id: 'cat-salary', name: 'Salary', icon: 'briefcase', color: '#16A34A', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance', icon: 'laptop', color: '#059669', type: 'income' },
  { id: 'cat-housing', name: 'Housing', icon: 'home', color: '#6366F1', type: 'expense' },
  { id: 'cat-food', name: 'Food & Dining', icon: 'utensils', color: '#F59E0B', type: 'expense' },
  { id: 'cat-transport', name: 'Transportation', icon: 'car', color: '#3B82F6', type: 'expense' },
  { id: 'cat-health', name: 'Healthcare', icon: 'heart', color: '#EF4444', type: 'expense' },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'film', color: '#8B5CF6', type: 'expense' },
  { id: 'cat-shopping', name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', type: 'expense' },
  { id: 'cat-utilities', name: 'Utilities', icon: 'zap', color: '#14B8A6', type: 'expense' },
  { id: 'cat-subscriptions', name: 'Subscriptions', icon: 'refresh-cw', color: '#F97316', type: 'expense' },
  { id: 'cat-savings', name: 'Savings', icon: 'piggy-bank', color: '#10B981', type: 'expense' },
  { id: 'cat-investments', name: 'Investments', icon: 'trending-up', color: '#6366F1', type: 'expense' },
];

function txn(
  id: string,
  date: string,
  amount: number,
  type: 'income' | 'expense',
  categoryId: string,
  accountId: string,
  description: string
): Transaction {
  return { id, date, amount, type, categoryId, accountId, description };
}

const today = new Date();
const currentBudgetYear = today.getFullYear();
const currentBudgetMonth = today.getMonth() + 1;

export const sampleTransactions: Transaction[] = [
  txn('t-1', format(today, 'yyyy-MM-dd'), 8500, 'income', 'cat-salary', 'acc-1', 'Acme Corp - Salary'),
  txn('t-2', format(today, 'yyyy-MM-dd'), 2200, 'expense', 'cat-housing', 'acc-1', 'Rent - Current month'),
  txn('t-3', format(subDays(today, 1), 'yyyy-MM-dd'), 87.50, 'expense', 'cat-food', 'acc-5', 'Whole Foods Market'),
  txn('t-4', format(subDays(today, 2), 'yyyy-MM-dd'), 1200, 'income', 'cat-freelance', 'acc-1', 'Design consulting - Client A'),
  txn('t-5', format(subDays(today, 3), 'yyyy-MM-dd'), 145.00, 'expense', 'cat-transport', 'acc-5', 'Shell Gas Station'),
  txn('t-6', format(subDays(today, 3), 'yyyy-MM-dd'), 62.40, 'expense', 'cat-food', 'acc-5', 'Chipotle + Dinner'),
  txn('t-7', format(subDays(today, 4), 'yyyy-MM-dd'), 14.99, 'expense', 'cat-subscriptions', 'acc-5', 'Netflix'),
  txn('t-8', format(subDays(today, 4), 'yyyy-MM-dd'), 9.99, 'expense', 'cat-subscriptions', 'acc-5', 'Spotify'),
  txn('t-9', format(subDays(today, 5), 'yyyy-MM-dd'), 180.00, 'expense', 'cat-health', 'acc-5', 'CVS Pharmacy'),
  txn('t-10', format(subDays(today, 6), 'yyyy-MM-dd'), 240.00, 'expense', 'cat-shopping', 'acc-5', 'Amazon.com'),
  txn('t-11', format(subDays(today, 7), 'yyyy-MM-dd'), 89.00, 'expense', 'cat-utilities', 'acc-1', 'Con Edison'),
  txn('t-12', format(subDays(today, 8), 'yyyy-MM-dd'), 500, 'expense', 'cat-investments', 'acc-1', 'Fidelity - Auto invest'),
  txn('t-13', format(subDays(today, 10), 'yyyy-MM-dd'), 320, 'expense', 'cat-entertainment', 'acc-5', 'Concert tickets'),
  txn('t-14', format(subDays(today, 12), 'yyyy-MM-dd'), 8500, 'income', 'cat-salary', 'acc-1', 'Acme Corp - Salary'),
  txn('t-15', format(subDays(today, 15), 'yyyy-MM-dd'), 55.00, 'expense', 'cat-food', 'acc-5', "Trader Joe's"),
];

export const sampleBudgets: Budget[] = [
  { id: 'b-1', categoryId: 'cat-housing', amount: 2200, period: 'monthly', year: currentBudgetYear, month: currentBudgetMonth },
  { id: 'b-2', categoryId: 'cat-food', amount: 600, period: 'monthly', year: currentBudgetYear, month: currentBudgetMonth },
  { id: 'b-3', categoryId: 'cat-transport', amount: 300, period: 'monthly', year: currentBudgetYear, month: currentBudgetMonth },
  { id: 'b-4', categoryId: 'cat-health', amount: 200, period: 'monthly', year: currentBudgetYear, month: currentBudgetMonth },
  { id: 'b-5', categoryId: 'cat-entertainment', amount: 250, period: 'monthly', year: currentBudgetYear, month: currentBudgetMonth },
  { id: 'b-6', categoryId: 'cat-shopping', amount: 300, period: 'monthly', year: currentBudgetYear, month: currentBudgetMonth },
  { id: 'b-7', categoryId: 'cat-subscriptions', amount: 80, period: 'monthly', year: currentBudgetYear, month: currentBudgetMonth },
  { id: 'b-8', categoryId: 'cat-utilities', amount: 120, period: 'monthly', year: currentBudgetYear, month: currentBudgetMonth },
];

export const sampleNetWorthHistory: NetWorthSnapshot[] = Array.from({ length: 13 }, (_, i) => {
  const date = subMonths(today, 12 - i);
  const base = 200000;
  const growth = i * 4500;
  const assets = base + growth;
  const liabilities = 21740 - i * 200;

  return {
    date: format(date, 'yyyy-MM-dd'),
    totalAssets: Math.round(assets),
    totalLiabilities: Math.round(liabilities),
    netWorth: Math.round(assets - liabilities),
  };
});

export const sampleMonthlyExpenses = [
  { month: 'Jan', income: 9700, expenses: 5200, savings: 4500 },
  { month: 'Feb', income: 9700, expenses: 4800, savings: 4900 },
  { month: 'Mar', income: 10200, expenses: 5600, savings: 4600 },
  { month: 'Apr', income: 9700, expenses: 5100, savings: 4600 },
  { month: 'May', income: 11200, expenses: 5300, savings: 5900 },
  { month: 'Jun', income: 9700, expenses: 4900, savings: 4800 },
];

export const sampleSpendingBreakdown = [
  { name: 'Housing', value: 2200, color: '#6366F1' },
  { name: 'Food', value: 605, color: '#F59E0B' },
  { name: 'Transport', value: 145, color: '#3B82F6' },
  { name: 'Shopping', value: 240, color: '#EC4899' },
  { name: 'Healthcare', value: 180, color: '#EF4444' },
  { name: 'Entertainment', value: 320, color: '#8B5CF6' },
  { name: 'Subscriptions', value: 65, color: '#F97316' },
  { name: 'Utilities', value: 89, color: '#14B8A6' },
];
