import { ProjectionAssumptions, MonteCarloResult } from '../../types/finance';

function normalRandom(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.max(Number.EPSILON, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

export function runMonteCarlo(
  initialNetWorth: number,
  annualSavings: number,
  retirementTarget: number,
  assumptions: ProjectionAssumptions,
  simulations = 1000,
  years = 30
): MonteCarloResult {
  const returnMean = assumptions.annualInvestmentReturn;
  const returnStd = 0.15;
  const safeSimulations = Math.max(1, Math.floor(simulations));
  const safeYears = Math.max(1, Math.floor(years));
  const retirementYear = Math.max(0, Math.min(assumptions.retirementAge - assumptions.currentAge, safeYears));
  const safeRetirementTarget = Math.max(0, retirementTarget);

  const allPaths: number[][] = [];

  for (let sim = 0; sim < safeSimulations; sim++) {
    const path: number[] = [initialNetWorth];
    let portfolio = initialNetWorth;
    let savings = annualSavings;

    for (let y = 1; y <= safeYears; y++) {
      const annualReturn = normalRandom(returnMean, returnStd);
      portfolio = portfolio * (1 + annualReturn) + savings;
      savings *= 1 + assumptions.annualIncomeGrowth - assumptions.annualExpenseGrowth;
      path.push(Math.max(0, portfolio));
    }
    allPaths.push(path);
  }

  const yearLabels = Array.from({ length: safeYears + 1 }, (_, i) => new Date().getFullYear() + i);

  const getPercentile = (paths: number[][], yearIdx: number, p: number): number => {
    const sorted = paths.map(path => path[yearIdx]).sort((a, b) => a - b);
    const rank = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(rank);
    const upper = Math.ceil(rank);
    const weight = rank - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  const successCount = allPaths.filter(
    path => path[retirementYear] >= safeRetirementTarget
  ).length;

  return {
    years: yearLabels,
    percentile10: yearLabels.map((_, i) => Math.round(getPercentile(allPaths, i, 10))),
    percentile25: yearLabels.map((_, i) => Math.round(getPercentile(allPaths, i, 25))),
    percentile50: yearLabels.map((_, i) => Math.round(getPercentile(allPaths, i, 50))),
    percentile75: yearLabels.map((_, i) => Math.round(getPercentile(allPaths, i, 75))),
    percentile90: yearLabels.map((_, i) => Math.round(getPercentile(allPaths, i, 90))),
    successProbability: successCount / safeSimulations,
  };
}
