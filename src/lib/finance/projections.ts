import { ProjectionAssumptions, ProjectionPoint } from '../../types/finance';
import { OneTimeEvent } from '../../types/scenario';

export function generateProjections(
  currentNetWorth: number,
  annualIncome: number,
  annualExpenses: number,
  assumptions: ProjectionAssumptions & { oneTimeEvents?: OneTimeEvent[] },
  years = 30
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];

  const startYear = new Date().getFullYear();
  let investmentValue = Math.max(0, currentNetWorth * 0.6);
  let netWorth = currentNetWorth;
  let income = annualIncome;
  let expenses = annualExpenses;

  const eventsByYear = new Map<number, OneTimeEvent[]>();
  for (const ev of (assumptions.oneTimeEvents ?? [])) {
    const list = eventsByYear.get(ev.year) ?? [];
    list.push(ev);
    eventsByYear.set(ev.year, list);
  }

  for (let i = 0; i <= years; i++) {
    const year = startYear + i;
    const events = eventsByYear.get(year) ?? [];

    for (const ev of events) {
      netWorth += ev.netWorthImpact;
      investmentValue = Math.max(0, investmentValue + ev.netWorthImpact);
      income += ev.incomeImpact ?? 0;
      expenses += ev.expenseImpact ?? 0;
    }

    const savings = income - expenses;
    const investmentReturn = investmentValue * assumptions.annualInvestmentReturn;
    investmentValue = Math.max(0, investmentValue + investmentReturn + savings);
    netWorth += savings + investmentReturn;

    points.push({
      year,
      age: assumptions.currentAge + i,
      netWorth: Math.round(netWorth),
      annualIncome: Math.round(income),
      annualExpenses: Math.round(expenses),
      annualSavings: Math.round(savings),
      investmentValue: Math.round(investmentValue),
    });

    income *= 1 + assumptions.annualIncomeGrowth;
    expenses *= 1 + assumptions.annualExpenseGrowth;
  }

  return points;
}
