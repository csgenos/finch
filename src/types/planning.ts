export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
export type RecurrenceRule = 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'yearly';
export type BillStatus = 'upcoming' | 'paid' | 'overdue' | 'autopay';

export interface PaycheckSchedule {
  id: string;
  name: string;
  frequency: PayFrequency;
  amount: number;
  nextPayDate: string;       // ISO date
  accountId: string;
  taxWithheld?: number;
  notes?: string;
}

export interface PaycheckAllocation {
  id: string;
  paycheckId: string;
  label: string;
  amount: number;
  type: 'bills' | 'spending' | 'savings' | 'debt' | 'investing';
  categoryId?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  accountId: string;
  recurrence: RecurrenceRule;
  nextDueDate: string;       // ISO date
  autopay: boolean;
  status: BillStatus;
  notes?: string;
}

export interface CashflowForecastPoint {
  date: string;              // ISO date
  projectedBalance: number;
  inflows: number;
  outflows: number;
  events: ForecastEvent[];
}

export interface ForecastEvent {
  label: string;
  amount: number;
  type: 'paycheck' | 'bill' | 'budget' | 'manual';
}

export interface OnboardingProfile {
  completed: boolean;
  completedAt?: string;
  currency: string;
  locale: string;
  country: string;
  state?: string;
  currentAge: number;
  retirementAge: number;
  monthlyIncome: number;
  payFrequency: PayFrequency;
  nextPayDate: string;
  savingsGoalMonthly: number;
  emergencyFundTarget: number;
  emergencyFundCurrent: number;
}

export interface ImportResult {
  success: number;
  skipped: number;
  errors: ImportError[];
  preview: ImportRow[];
}

export interface ImportRow {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  raw: Record<string, string>;
  error?: string;
}

export interface ImportError {
  row: number;
  message: string;
  raw: Record<string, string>;
}
