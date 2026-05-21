import { Account, Budget, Category } from '../../types/finance';
import { Goal } from '../../types/goals';
import { OnboardingProfile, PayFrequency, RecurringExpense } from '../../types/planning';

export type IncomeType = 'monthly' | 'hourly';

const MONTHS_PER_YEAR = 12;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function paychecksPerMonth(frequency: PayFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 52 / MONTHS_PER_YEAR;
    case 'biweekly':
      return 26 / MONTHS_PER_YEAR;
    case 'semimonthly':
      return 2;
    case 'monthly':
      return 1;
  }
}

export function estimateMonthlyIncome(input: {
  incomeType: IncomeType;
  monthlyIncome?: number;
  hourlyRate?: number;
  hoursPerWeek?: number;
}): number {
  if (input.incomeType === 'hourly') {
    const hourlyRate = input.hourlyRate ?? 0;
    const hoursPerWeek = input.hoursPerWeek ?? 0;
    return roundMoney((hourlyRate * hoursPerWeek * 52) / MONTHS_PER_YEAR);
  }

  return roundMoney(input.monthlyIncome ?? 0);
}

export function estimatePaycheckAmount(monthlyIncome: number, frequency: PayFrequency): number {
  const periodsPerMonth = paychecksPerMonth(frequency);
  return periodsPerMonth > 0 ? roundMoney(monthlyIncome / periodsPerMonth) : 0;
}

export function recurrenceToMonthlyAmount(expense: Pick<RecurringExpense, 'amount' | 'recurrence'>): number {
  switch (expense.recurrence) {
    case 'daily':
      return roundMoney((expense.amount * 365) / MONTHS_PER_YEAR);
    case 'weekly':
      return roundMoney((expense.amount * 52) / MONTHS_PER_YEAR);
    case 'biweekly':
      return roundMoney((expense.amount * 26) / MONTHS_PER_YEAR);
    case 'semimonthly':
      return roundMoney(expense.amount * 2);
    case 'monthly':
      return roundMoney(expense.amount);
    case 'quarterly':
      return roundMoney(expense.amount / 3);
    case 'yearly':
      return roundMoney(expense.amount / MONTHS_PER_YEAR);
  }
}

function categoryKeywords(): Record<string, string[]> {
  return {
    'cat-housing': ['rent', 'mortgage', 'hoa', 'lease'],
    'cat-utilities': ['utility', 'electric', 'water', 'gas', 'internet', 'phone'],
    'cat-transport': ['car', 'auto', 'gas', 'fuel', 'parking', 'toll'],
    'cat-health': ['insurance', 'doctor', 'medical', 'health', 'pharmacy'],
    'cat-subscriptions': ['subscription', 'netflix', 'spotify', 'hulu', 'disney', 'apple'],
    'cat-food': ['grocery', 'groceries', 'food', 'meal'],
  };
}

export function inferBillCategoryId(categories: Category[], billName: string): string {
  const lower = billName.toLowerCase();
  const keywords = categoryKeywords();

  for (const [categoryId, terms] of Object.entries(keywords)) {
    if (terms.some(term => lower.includes(term)) && categories.some(category => category.id === categoryId)) {
      return categoryId;
    }
  }

  return categories.find(category => category.type === 'expense')?.id ?? '';
}

export interface StarterFinanceState {
  accounts: Account[];
  budgets: Budget[];
  paychecks: OnboardingProfile['monthlyIncome'] extends number ? Array<{
    id: string;
    name: string;
    frequency: PayFrequency;
    amount: number;
    nextPayDate: string;
    accountId: string;
  }> : never;
  allocations: Array<{
    id: string;
    paycheckId: string;
    label: string;
    amount: number;
    type: 'bills' | 'spending' | 'savings' | 'debt' | 'investing';
  }>;
  recurringExpenses: RecurringExpense[];
  goals: Goal[];
}

export function buildStarterFinanceState(
  profile: OnboardingProfile,
  categories: Category[],
  recurringExpenses: RecurringExpense[]
): StarterFinanceState {
  const now = new Date().toISOString();
  const primaryCheckingId = 'starter-checking';
  const emergencyFundId = 'starter-emergency-fund';
  const primaryPaycheckId = 'starter-paycheck';
  const monthlyIncome = roundMoney(profile.monthlyIncome);

  const normalizedRecurringExpenses = recurringExpenses.map(expense => ({
    ...expense,
    accountId: expense.accountId || primaryCheckingId,
    categoryId: expense.categoryId || inferBillCategoryId(categories, expense.name),
  }));

  const accounts: Account[] = [
    {
      id: primaryCheckingId,
      name: 'Primary Checking',
      type: 'checking',
      balance: 0,
      currency: profile.currency,
      lastUpdated: now,
    },
  ];

  if (profile.emergencyFundCurrent > 0) {
    accounts.push({
      id: emergencyFundId,
      name: 'Emergency Fund',
      type: 'savings',
      balance: roundMoney(profile.emergencyFundCurrent),
      currency: profile.currency,
      lastUpdated: now,
    });
  }

  const paychecks = monthlyIncome > 0 ? [{
    id: primaryPaycheckId,
    name: 'Primary Income',
    frequency: profile.payFrequency,
    amount: estimatePaycheckAmount(monthlyIncome, profile.payFrequency),
    nextPayDate: profile.nextPayDate,
    accountId: primaryCheckingId,
  }] : [];

  const allocations = paychecks.length > 0 && profile.savingsGoalMonthly > 0 ? [{
    id: 'starter-allocation-savings',
    paycheckId: primaryPaycheckId,
    label: 'Savings Goal',
    amount: roundMoney(profile.savingsGoalMonthly / paychecksPerMonth(profile.payFrequency)),
    type: 'savings' as const,
  }] : [];

  const goals: Goal[] = [];
  if (profile.emergencyFundTarget > 0) {
    goals.push({
      id: 'goal-emergency-fund',
      name: 'Emergency Fund',
      category: 'emergency_fund',
      targetAmount: roundMoney(profile.emergencyFundTarget),
      currentAmount: roundMoney(profile.emergencyFundCurrent),
      accountId: profile.emergencyFundCurrent > 0 ? emergencyFundId : undefined,
      createdAt: now,
    });
  }

  const currentDate = new Date();
  const budgetBuckets = new Map<string, number>();
  normalizedRecurringExpenses.forEach(expense => {
    if (!expense.categoryId) return;
    budgetBuckets.set(expense.categoryId, roundMoney((budgetBuckets.get(expense.categoryId) ?? 0) + recurrenceToMonthlyAmount(expense)));
  });

  const budgets: Budget[] = Array.from(budgetBuckets.entries()).map(([categoryId, amount], index) => ({
    id: `starter-budget-${index + 1}`,
    categoryId,
    amount,
    period: 'monthly',
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  }));

  return {
    accounts,
    budgets,
    paychecks,
    allocations,
    recurringExpenses: normalizedRecurringExpenses,
    goals,
  };
}
