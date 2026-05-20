import { ProjectionAssumptions, ProjectionPoint } from '../../types/finance';

export function generateProjections(
  currentNetWorth: number,
  annualIncome: number,
  annualExpenses: number,
  assumptions: ProjectionAssumptions,
  years = 30
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  let netWorth = currentNetWorth;
  let income = annualIncome;
  let expenses = annualExpenses;
  let investmentValue = currentNetWorth * 0.6;
  const startYear = new Date().getFullYear();

  for (let i = 0; i <= years; i++) {
    const age = assumptions.currentAge + i;
    const savings = income - expenses;

    points.push({
      year: startYear + i,
      age,
      netWorth: Math.round(netWorth),
      annualIncome: Math.round(income),
      annualExpenses: Math.round(expenses),
      annualSavings: Math.round(savings),
      investmentValue: Math.round(investmentValue),
    });

    const investmentGain = investmentValue * assumptions.annualInvestmentReturn;
    investmentValue += investmentGain + Math.max(0, savings);
    netWorth += savings + investmentGain;
    income *= 1 + assumptions.annualIncomeGrowth;
    expenses *= 1 + assumptions.annualExpenseGrowth;
  }

  return points;
}
