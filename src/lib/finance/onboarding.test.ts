import { describe, expect, it } from 'vitest';
import { buildStarterFinanceState, estimateMonthlyIncome, estimatePaycheckAmount, recurrenceToMonthlyAmount } from './onboarding';
import { sampleCategories } from '../../data/sampleData';
import { OnboardingProfile, RecurringExpense } from '../../types/planning';

describe('onboarding helpers', () => {
  it('estimates monthly income from hourly pay and hours per week', () => {
    expect(estimateMonthlyIncome({
      incomeType: 'hourly',
      hourlyRate: 25,
      hoursPerWeek: 40,
    })).toBeCloseTo(4333.33, 2);
  });

  it('estimates paycheck amount from monthly income and frequency', () => {
    expect(estimatePaycheckAmount(6000, 'biweekly')).toBeCloseTo(2769.23, 2);
  });

  it('builds starter finance state from onboarding inputs without fake transactions', () => {
    const profile: OnboardingProfile = {
      completed: true,
      currency: 'USD',
      locale: 'en-US',
      country: 'US',
      state: 'CA',
      taxResidency: 'US-CA',
      currentAge: 30,
      retirementAge: 65,
      incomeType: 'monthly',
      monthlyIncome: 5000,
      payFrequency: 'biweekly',
      nextPayDate: '2026-05-30',
      savingsGoalMonthly: 500,
      emergencyFundTarget: 12000,
      emergencyFundCurrent: 3000,
    };
    const recurringExpenses: RecurringExpense[] = [{
      id: 'bill-1',
      name: 'Rent',
      amount: 1800,
      categoryId: 'cat-housing',
      accountId: 'starter-checking',
      recurrence: 'monthly',
      nextDueDate: '2026-06-01',
      autopay: false,
      status: 'upcoming',
    }];

    const state = buildStarterFinanceState(profile, sampleCategories, recurringExpenses);

    expect(state.accounts.map(account => account.name)).toEqual(['Primary Checking', 'Emergency Fund']);
    expect(state.paychecks).toHaveLength(1);
    expect(state.recurringExpenses).toHaveLength(1);
    expect(state.goals[0]?.currentAmount).toBe(3000);
    expect(state.budgets[0]?.amount).toBe(1800);
  });

  it('normalizes recurring expenses to monthly amounts', () => {
    expect(recurrenceToMonthlyAmount({ amount: 200, recurrence: 'weekly' })).toBeCloseTo(866.67, 2);
  });
});
