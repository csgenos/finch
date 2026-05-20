// Web Worker for Monte Carlo simulation — keeps UI thread free
import { ProjectionAssumptions, MonteCarloResult } from '../../types/finance';

interface WorkerInput {
  initialNetWorth: number;
  annualSavings: number;
  assumptions: ProjectionAssumptions;
  simulations: number;
  years: number;
  volatility: number;
  contributionGrowthRate: number;
}

function normalRandom(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { initialNetWorth, annualSavings, assumptions, simulations, years, volatility, contributionGrowthRate } = e.data;

  const allPaths: number[][] = [];

  for (let sim = 0; sim < simulations; sim++) {
    const path: number[] = [initialNetWorth];
    let portfolio = initialNetWorth;
    let savings = annualSavings;

    for (let y = 1; y <= years; y++) {
      const annualReturn = normalRandom(assumptions.annualInvestmentReturn, volatility);
      portfolio = portfolio * (1 + annualReturn) + savings;
      savings *= 1 + contributionGrowthRate;
      path.push(Math.max(0, portfolio));
    }
    allPaths.push(path);
  }

  const yearLabels = Array.from({ length: years + 1 }, (_, i) => new Date().getFullYear() + i);

  const getPercentile = (yearIdx: number, p: number): number => {
    const sorted = allPaths.map(path => path[yearIdx]).sort((a, b) => a - b);
    const idx = Math.floor((p / 100) * sorted.length);
    return sorted[Math.min(idx, sorted.length - 1)];
  };

  const retirementYear = Math.min(assumptions.retirementAge - assumptions.currentAge, years);
  const successCount = allPaths.filter(path => path[retirementYear] > 0).length;

  const result: MonteCarloResult = {
    years: yearLabels,
    percentile10: yearLabels.map((_, i) => Math.round(getPercentile(i, 10))),
    percentile25: yearLabels.map((_, i) => Math.round(getPercentile(i, 25))),
    percentile50: yearLabels.map((_, i) => Math.round(getPercentile(i, 50))),
    percentile75: yearLabels.map((_, i) => Math.round(getPercentile(i, 75))),
    percentile90: yearLabels.map((_, i) => Math.round(getPercentile(i, 90))),
    successProbability: successCount / simulations,
  };

  self.postMessage(result);
};
