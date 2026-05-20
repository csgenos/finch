import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { generateProjections } from '../lib/finance/projections';
import { ProjectionChart } from '../components/charts/ProjectionChart';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils/format';
import { calculateNetWorth, calculateMonthSummary } from '../lib/finance/cashflow';
import { clamp, parseFiniteNumber } from '../lib/utils/numbers';

export function Projections() {
  const { accounts, transactions, assumptions, updateAssumptions } = useFinanceStore();
  const now = new Date();

  const netWorth = useMemo(() => calculateNetWorth(accounts), [accounts]);
  const summary = useMemo(
    () => calculateMonthSummary(transactions, now.getFullYear(), now.getMonth() + 1),
    [transactions]
  );

  const projections = useMemo(() => generateProjections(
    netWorth,
    summary.totalIncome * 12,
    summary.totalExpenses * 12,
    assumptions,
    40
  ), [netWorth, summary, assumptions]);

  const retirementYear = assumptions.retirementAge - assumptions.currentAge;
  const retirementIndex = Math.max(0, Math.min(retirementYear, projections.length - 1));
  const retirementPoint = projections[retirementIndex];
  const finalPoint = projections[projections.length - 1];

  const assumptionFields: { key: keyof typeof assumptions; label: string; scale: number; suffix: string }[] = [
    { key: 'annualIncomeGrowth', label: 'Income Growth', scale: 100, suffix: '%/yr' },
    { key: 'annualExpenseGrowth', label: 'Expense Growth', scale: 100, suffix: '%/yr' },
    { key: 'annualInvestmentReturn', label: 'Investment Return', scale: 100, suffix: '%/yr' },
    { key: 'annualInflation', label: 'Inflation', scale: 100, suffix: '%/yr' },
    { key: 'currentAge', label: 'Current Age', scale: 1, suffix: 'yrs' },
    { key: 'retirementAge', label: 'Retirement Age', scale: 1, suffix: 'yrs' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">At Retirement (Age {assumptions.retirementAge})</p>
          <p className="text-2xl font-semibold mt-1 text-foreground tabular-nums">{formatCurrency(retirementPoint?.netWorth ?? 0, 'USD', true)}</p>
          <p className="text-xs text-muted-foreground mt-1">In {retirementYear} years</p>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">40-Year Peak</p>
          <p className="text-2xl font-semibold mt-1 text-foreground tabular-nums">{formatCurrency(finalPoint?.netWorth ?? 0, 'USD', true)}</p>
          <p className="text-xs text-muted-foreground mt-1">Year {finalPoint?.year}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Projected Annual Savings</p>
          <p className="text-2xl font-semibold mt-1 text-foreground tabular-nums">{formatCurrency(retirementPoint?.annualSavings ?? 0, 'USD', true)}</p>
          <p className="text-xs text-muted-foreground mt-1">At retirement age</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">40-Year Projection</h2>
        <p className="text-xs text-muted-foreground mb-4">Net worth and investment value trajectory</p>
        <div className="h-72">
          <ProjectionChart data={projections} />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Assumptions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {assumptionFields.map(({ key, label, scale, suffix }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step={scale === 100 ? '0.1' : '1'}
                  value={(assumptions[key] * scale).toFixed(scale === 100 ? 1 : 0)}
                  onChange={e => {
                    const val = parseFiniteNumber(e.target.value);
                    if (val === null) return;
                    const normalized = val / scale;
                    const next = key === 'currentAge' || key === 'retirementAge'
                      ? Math.trunc(clamp(normalized, 0, 120))
                      : clamp(normalized, -0.5, 0.5);
                    updateAssumptions({ [key]: next });
                  }}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
