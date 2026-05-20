import { endOfMonth, format, subMonths } from 'date-fns';
import { Category, MonthSummary, NetWorthSnapshot, Transaction } from '../../types/finance';
import { parseDateInput } from '../utils/dateParsing';

export function calculateMonthSummary(
  transactions: Transaction[],
  year: number,
  month: number
): MonthSummary {
  const filtered = transactions.filter(t => {
    const d = parseDateInput(t.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const totalIncome = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? netCashFlow / totalIncome : 0;

  const categoryTotals = filtered
    .filter(t => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {});

  const topCategories = Object.entries(categoryTotals)
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return { year, month, totalIncome, totalExpenses, netCashFlow, savingsRate, topCategories };
}

export function calculateNetWorth(accounts: { balance: number }[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function calculateTotalAssets(accounts: { balance: number; type: string }[]): number {
  return accounts
    .filter(a => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);
}

export function calculateTotalLiabilities(accounts: { balance: number }[]): number {
  return accounts
    .filter(a => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);
}

export interface CashFlowChartPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface SpendingBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export function calculateCashFlowSeries(
  transactions: Transaction[],
  months = 6,
  referenceDate = new Date()
): CashFlowChartPoint[] {
  return Array.from({ length: months }, (_, index) => {
    const monthDate = subMonths(referenceDate, months - index - 1);
    const summary = calculateMonthSummary(
      transactions,
      monthDate.getFullYear(),
      monthDate.getMonth() + 1
    );

    return {
      month: format(monthDate, 'MMM'),
      income: summary.totalIncome,
      expenses: summary.totalExpenses,
      savings: summary.netCashFlow,
    };
  });
}

export function calculateSpendingBreakdown(
  transactions: Transaction[],
  categories: Category[],
  year: number,
  month: number
): SpendingBreakdownItem[] {
  const expenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const date = parseDateInput(t.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const totals = expenses.reduce<Record<string, number>>((acc, txn) => {
    acc[txn.categoryId] = (acc[txn.categoryId] ?? 0) + txn.amount;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([categoryId, value]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        name: category?.name ?? 'Uncategorized',
        value,
        color: category?.color ?? '#94A3B8',
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function estimateNetWorthHistory(
  accounts: { balance: number }[],
  transactions: Transaction[],
  months = 12,
  referenceDate = new Date()
): NetWorthSnapshot[] {
  const currentAssets = calculateTotalAssets(accounts);
  const currentLiabilities = calculateTotalLiabilities(accounts);
  const currentNetWorth = calculateNetWorth(accounts);

  const monthSummaries = Array.from({ length: months }, (_, index) => {
    const monthDate = subMonths(referenceDate, months - index);
    return {
      date: monthDate,
      summary: calculateMonthSummary(
        transactions,
        monthDate.getFullYear(),
        monthDate.getMonth() + 1
      ),
    };
  });

  const futureCashFlows = monthSummaries
    .map(item => item.summary.netCashFlow)
    .concat(calculateMonthSummary(
      transactions,
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1
    ).netCashFlow);

  return monthSummaries.map((item, index) => {
    const cashFlowsAfterMonth = futureCashFlows
      .slice(index + 1)
      .reduce((sum, value) => sum + value, 0);
    const estimatedNetWorth = currentNetWorth - cashFlowsAfterMonth;
    const estimatedAssets = Math.max(0, estimatedNetWorth + currentLiabilities);

    return {
      date: endOfMonth(item.date).toISOString(),
      totalAssets: Math.round(estimatedAssets),
      totalLiabilities: Math.round(currentLiabilities),
      netWorth: Math.round(estimatedNetWorth),
    };
  }).concat({
    date: endOfMonth(referenceDate).toISOString(),
    totalAssets: Math.round(currentAssets),
    totalLiabilities: Math.round(currentLiabilities),
    netWorth: Math.round(currentNetWorth),
  });
}

export function calculateBudgetAdherenceRate(
  transactions: Transaction[],
  budgets: { categoryId: string; amount: number; year: number; month?: number }[],
  year: number,
  month: number
): number {
  const activeBudgets = budgets.filter(
    budget => budget.year === year && (budget.month === undefined || budget.month === month)
  );
  if (activeBudgets.length === 0) return 1;

  const totalBudget = activeBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  if (totalBudget <= 0) return 1;

  const monthlyCategorySpend = transactions.reduce<Record<string, number>>((acc, transaction) => {
    if (transaction.type !== 'expense') return acc;

    const date = parseDateInput(transaction.date);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month) return acc;

    acc[transaction.categoryId] = (acc[transaction.categoryId] ?? 0) + transaction.amount;
    return acc;
  }, {});

  const spent = activeBudgets.reduce((sum, budget) => {
    const categorySpend = monthlyCategorySpend[budget.categoryId] ?? 0;

    return sum + Math.min(categorySpend, budget.amount);
  }, 0);

  return Math.max(0, Math.min(spent / totalBudget, 1));
}
