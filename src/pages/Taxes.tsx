import { useState } from 'react';
import { TaxResidencySelect } from '../components/ui/TaxResidencySelect';
import { inferTaxResidency } from '../data/taxes/jurisdictions';
import { calculateFederalTax } from '../lib/taxes/taxEngine';
import { cn } from '../lib/utils/cn';
import { formatCurrency, formatPercent } from '../lib/utils/format';
import { parseMoney } from '../lib/utils/numbers';
import { useSettingsStore } from '../store/useSettingsStore';
import { FilingStatus, SUPPORTED_TAX_YEAR, SUPPORTED_TAX_YEARS, TaxYear } from '../types/tax';

export function Taxes() {
  const onboarding = useSettingsStore(s => s.onboarding);
  const [grossIncome, setGrossIncome] = useState('120000');
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [retirement, setRetirement] = useState('19500');
  const [taxYear, setTaxYear] = useState<TaxYear>(SUPPORTED_TAX_YEAR);
  const [taxResidency, setTaxResidency] = useState(
    onboarding?.taxResidency ?? inferTaxResidency(onboarding?.country, onboarding?.state),
  );

  const grossIncomeValue = Math.max(0, parseMoney(grossIncome) ?? 0);
  const retirementValue = Math.max(0, parseMoney(retirement) ?? 0);
  const result = calculateFederalTax({
    grossIncome: grossIncomeValue,
    filingStatus,
    year: taxYear,
    taxResidency,
    retirementContributions: retirementValue,
  });

  return (
    <div className="p-6 space-y-6 max-w-screen-md mx-auto">
      <div className="bg-surface border border-border rounded-lg shadow-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Tax Inputs - {taxYear}</h2>
        <p className="text-xs text-muted-foreground">
          US selections use federal, payroll, and state estimates. European selections use a national income-tax estimate and exclude country-specific social contributions.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Gross Income
            </label>
            <input
              type="number"
              value={grossIncome}
              min="0"
              onChange={e => setGrossIncome(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Filing Status
            </label>
            <select
              value={filingStatus}
              onChange={e => setFilingStatus(e.target.value as FilingStatus)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="single">Single</option>
              <option value="married_filing_jointly">Married Filing Jointly</option>
              <option value="married_filing_separately">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
            </select>
          </div>
          <div className="col-span-2">
            <TaxResidencySelect value={taxResidency} onValueChange={setTaxResidency} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Tax Year
            </label>
            <select
              value={taxYear}
              onChange={e => setTaxYear(Number(e.target.value) as TaxYear)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {SUPPORTED_TAX_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              401(k) / IRA Contributions
            </label>
            <input
              type="number"
              value={retirement}
              min="0"
              onChange={e => setRetirement(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tax', value: formatCurrency(result.totalTax), color: 'text-negative' },
          { label: 'Effective Rate', value: formatPercent(result.effectiveRate), color: 'text-foreground' },
          { label: 'Marginal Rate', value: formatPercent(result.marginalRate), color: 'text-foreground' },
          { label: 'After-Tax Income', value: formatCurrency(result.afterTaxIncome), color: 'text-positive' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-lg shadow-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className={cn('text-xl font-semibold mt-1 tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Tax Breakdown</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: 'Gross Income', value: formatCurrency(result.grossIncome), muted: false },
            { label: 'Retirement Contributions', value: `-${formatCurrency(result.grossIncome - result.adjustedGrossIncome)}`, muted: true },
            { label: 'Adjusted Gross Income', value: formatCurrency(result.adjustedGrossIncome), muted: false },
            { label: 'Standard Deduction', value: `-${formatCurrency(result.adjustedGrossIncome - result.taxableIncome)}`, muted: true },
            { label: 'Taxable Income', value: formatCurrency(result.taxableIncome), muted: false },
          ].map(({ label, value, muted }) => (
            <div key={label} className="px-5 py-3 flex justify-between items-center">
              <span className={cn('text-sm', muted ? 'text-muted-foreground' : 'text-foreground font-medium')}>
                {label}
              </span>
              <span className={cn('text-sm tabular-nums', muted ? 'text-muted-foreground' : 'text-foreground font-medium')}>
                {value}
              </span>
            </div>
          ))}
          <div className="px-5 py-3 bg-muted">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tax Components
            </span>
          </div>
          {result.breakdown.map(item => (
            <div key={item.label} className="px-5 py-3 flex justify-between items-center">
              <div>
                <span className="text-sm text-foreground">{item.label}</span>
                {item.rate !== undefined && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formatPercent(item.rate)})
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
