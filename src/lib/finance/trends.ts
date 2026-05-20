import { Transaction, Category } from '../../types/finance';

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  thisMonth: number;
  threeMonthAvg: number;
  delta: number;
  deltaPercent: number;
  isAnomaly: boolean;
}

function getMonthSpend(
  transactions: Transaction[],
  year: number,
  month: number
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const [y, m] = t.date.split('-').map(Number);
    if (y !== year || m !== month) continue;
    result[t.categoryId] = (result[t.categoryId] ?? 0) + t.amount;
  }
  return result;
}

export function getCategoryTrends(
  transactions: Transaction[],
  categories: Category[],
  year: number,
  month: number
): CategoryTrend[] {
  const thisMonthSpend = getMonthSpend(transactions, year, month);

  const prevMonths: Record<string, number>[] = [];
  for (let i = 1; i <= 3; i++) {
    let m = month - i;
    let y = year;
    if (m <= 0) { m += 12; y -= 1; }
    prevMonths.push(getMonthSpend(transactions, y, m));
  }

  const allCatIds = new Set([
    ...Object.keys(thisMonthSpend),
    ...prevMonths.flatMap(pm => Object.keys(pm)),
  ]);

  const trends: CategoryTrend[] = [];
  for (const catId of allCatIds) {
    const category = categories.find(c => c.id === catId);
    if (!category || category.type !== 'expense') continue;

    const thisMonth = thisMonthSpend[catId] ?? 0;
    const prevValues = prevMonths.map(pm => pm[catId] ?? 0);
    const threeMonthAvg = prevValues.reduce((a, b) => a + b, 0) / 3;
    const delta = thisMonth - threeMonthAvg;
    const deltaPercent = threeMonthAvg > 1 ? delta / threeMonthAvg : 0;
    const isAnomaly = threeMonthAvg > 0 && Math.abs(deltaPercent) > 0.25 && Math.abs(delta) > 20;

    trends.push({
      categoryId: catId,
      categoryName: category.name,
      thisMonth,
      threeMonthAvg,
      delta,
      deltaPercent,
      isAnomaly,
    });
  }

  return trends.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
