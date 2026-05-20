import { describe, expect, it } from 'vitest';
import { generateProjections } from './projections';

const assumptions = {
  annualIncomeGrowth: 0.05,
  annualExpenseGrowth: 0.02,
  annualInflation: 0.03,
  annualInvestmentReturn: 0.07,
  targetSavingsRate: 0.2,
  retirementAge: 65,
  currentAge: 30,
};

describe('generateProjections', () => {
  it('keeps the first point anchored to the current financial snapshot', () => {
    const [firstPoint] = generateProjections(100000, 120000, 80000, assumptions, 2);

    expect(firstPoint.age).toBe(30);
    expect(firstPoint.netWorth).toBe(100000);
    expect(firstPoint.annualIncome).toBe(120000);
    expect(firstPoint.annualExpenses).toBe(80000);
    expect(firstPoint.annualSavings).toBe(40000);
    expect(firstPoint.investmentValue).toBe(60000);
  });

  it('grows future years from the prior point using savings and return assumptions', () => {
    const projections = generateProjections(100000, 120000, 80000, assumptions, 2);
    const secondPoint = projections[1];

    expect(secondPoint.age).toBe(31);
    expect(secondPoint.netWorth).toBe(148600);
    expect(secondPoint.annualIncome).toBe(126000);
    expect(secondPoint.annualExpenses).toBe(81600);
    expect(secondPoint.annualSavings).toBe(44400);
    expect(secondPoint.investmentValue).toBe(108600);
  });
});
