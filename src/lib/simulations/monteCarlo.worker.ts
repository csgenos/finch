// Web Worker for Monte Carlo simulation - keeps the UI thread free.
import { ProjectionAssumptions, MonteCarloResult } from '../../types/finance';

interface WorkerInput {
  initialNetWorth: number;
  annualSavings: number;
  retirementTarget: number;
  assumptions: ProjectionAssumptions;
  simulations: number;
  years: number;
  volatility: number;
  contributionGrowthRate: number;
}

function normalRandom(mean: number, std: number): number {
  const u1 = Math.max(Number.EPSILON, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const {
    initialNetWorth,
    annualSavings,
    retirementTarget,
    assumptions,
    simulations,
    years,
    volatility,
    contributionGrowthRate,
  } = e.data;
  const safeSimulations = Math.max(1, Math.floor(simulations));
  const safeYears = Math.max(1, Math.floor(years));
  const safeVolatility = Math.max(0, volatility);
  const safeContributionGrowthRate = Number.isFinite(contributionGrowthRate) ? contributionGrowthRate : 0;
  const retirementYear = Math.max(
    0,
    Math.min(safeYears, assumptions.retirementAge - assumptions.currentAge)
  );
  const safeRetirementTarget = Math.max(0, retirementTarget);

  const allPaths: number[][] = [];

  for (let sim = 0; sim < safeSimulations; sim++) {
    const path: number[] = [initialNetWorth];
    let portfolio = initialNetWorth;
    let savings = annualSavings;

    for (let y = 1; y <= safeYears; y++) {
      const annualReturn = normalRandom(assumptions.annualInvestmentReturn, safeVolatility);
      portfolio = portfolio * (1 + annualReturn) + savings;
      savings *= 1 + safeContributionGrowthRate;
      path.push(Math.max(0, portfolio));
    }
    allPaths.push(path);
  }

  const yearLabels = Array.from({ length: safeYears + 1 }, (_, i) => new Date().getFullYear() + i);

  const getPercentile = (yearIdx: number, p: number): number => {
    const sorted = allPaths.map(path => path[yearIdx]).sort((a, b) => a - b);
    const rank = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(rank);
    const upper = Math.ceil(rank);
    const weight = rank - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  const successCount = allPaths.filter(
    path => path[retirementYear] >= safeRetirementTarget
  ).length;

  const result: MonteCarloResult = {
    years: yearLabels,
    percentile10: yearLabels.map((_, i) => Math.round(getPercentile(i, 10))),
    percentile25: yearLabels.map((_, i) => Math.round(getPercentile(i, 25))),
    percentile50: yearLabels.map((_, i) => Math.round(getPercentile(i, 50))),
    percentile75: yearLabels.map((_, i) => Math.round(getPercentile(i, 75))),
    percentile90: yearLabels.map((_, i) => Math.round(getPercentile(i, 90))),
    successProbability: successCount / safeSimulations,
  };

  self.postMessage(result);
};
