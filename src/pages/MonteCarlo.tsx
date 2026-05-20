import { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Loader2 } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { calculateNetWorth, calculateMonthSummary } from '../lib/finance/cashflow';
import { formatCurrency, formatPercent } from '../lib/utils/format';
import { MonteCarloResult } from '../types/finance';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface SimParams {
  years: number;
  simulations: number;
  expectedReturn: number;
  volatility: number;
  inflation: number;
  contributionGrowthRate: number;
}

export function MonteCarlo() {
  const { accounts, transactions, assumptions } = useFinanceStore();
  const now = new Date();
  const netWorth = calculateNetWorth(accounts);
  const summary = calculateMonthSummary(transactions, now.getFullYear(), now.getMonth() + 1);

  const [params, setParams] = useState<SimParams>({
    years: 30,
    simulations: 1000,
    expectedReturn: assumptions.annualInvestmentReturn * 100,
    volatility: 15,
    inflation: assumptions.annualInflation * 100,
    contributionGrowthRate: (assumptions.annualIncomeGrowth - assumptions.annualExpenseGrowth) * 100,
  });

  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const setParam = (key: keyof SimParams, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) setParams(p => ({ ...p, [key]: num }));
  };

  const runSimulation = useCallback(() => {
    if (running) return;
    setRunning(true);

    if (workerRef.current) workerRef.current.terminate();

    const worker = new Worker(
      new URL('../lib/simulations/monteCarlo.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<MonteCarloResult>) => {
      setResult(e.data);
      setRunning(false);
    };

    worker.onerror = () => setRunning(false);

    worker.postMessage({
      initialNetWorth: netWorth,
      annualSavings: summary.netCashFlow * 12,
      assumptions: {
        ...assumptions,
        annualInvestmentReturn: params.expectedReturn / 100,
        annualInflation: params.inflation / 100,
      },
      simulations: params.simulations,
      years: params.years,
      volatility: params.volatility / 100,
      contributionGrowthRate: params.contributionGrowthRate / 100,
    });
  }, [running, netWorth, summary, assumptions, params]);

  useEffect(() => {
    runSimulation();
    return () => workerRef.current?.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = result
    ? result.years.map((year, i) => ({
        year,
        p10: result.percentile10[i],
        p25: result.percentile25[i],
        p50: result.percentile50[i],
        p75: result.percentile75[i],
        p90: result.percentile90[i],
      }))
    : [];

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      {/* Controls */}
      <div className="bg-surface border border-border rounded-lg shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Simulation Parameters</h2>
            <p className="text-xs text-muted-foreground">Runs in a Web Worker — UI stays responsive</p>
          </div>
          <Button onClick={runSimulation} loading={running} size="sm">
            {!running && <Play size={12} />}
            Run Simulation
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Input label="Projection Years" type="number" min="5" max="60" value={params.years.toString()} onChange={e => setParam('years', e.target.value)} />
          <Input label="Simulations" type="number" min="100" max="5000" step="100" value={params.simulations.toString()} onChange={e => setParam('simulations', e.target.value)} />
          <Input label="Expected Return (%)" type="number" step="0.1" value={params.expectedReturn.toString()} onChange={e => setParam('expectedReturn', e.target.value)} />
          <Input label="Volatility / Std Dev (%)" type="number" step="0.5" value={params.volatility.toString()} onChange={e => setParam('volatility', e.target.value)} hint="Higher = wider outcome spread" />
          <Input label="Inflation (%)" type="number" step="0.1" value={params.inflation.toString()} onChange={e => setParam('inflation', e.target.value)} />
          <Input label="Contribution Growth (%)" type="number" step="0.1" value={params.contributionGrowthRate.toString()} onChange={e => setParam('contributionGrowthRate', e.target.value)} hint="Annual savings growth rate" />
        </div>
      </div>

      {/* Result cards */}
      {result && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Success Probability</p>
            <p className={`text-3xl font-semibold mt-1 tabular-nums ${result.successProbability >= 0.8 ? 'text-positive' : result.successProbability >= 0.6 ? 'text-warning' : 'text-negative'}`}>
              {formatPercent(result.successProbability)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">reached retirement goal</p>
          </div>
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Median at Year {params.years}</p>
            <p className="text-2xl font-semibold mt-1 text-foreground tabular-nums">
              {result.percentile50.length > params.years ? formatCurrency(result.percentile50[params.years], 'USD', true) : '—'}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">90th Percentile at Year {params.years}</p>
            <p className="text-2xl font-semibold mt-1 text-foreground tabular-nums">
              {result.percentile90.length > params.years ? formatCurrency(result.percentile90[params.years], 'USD', true) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-surface border border-border rounded-lg shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Outcome Distribution</h2>
            <p className="text-xs text-muted-foreground">{params.simulations.toLocaleString()} simulations · percentile bands</p>
          </div>
          {running && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 size={12} className="animate-spin" />Running…</div>}
        </div>

        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="outerBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="innerBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={Math.floor(params.years / 6)} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v, 'USD', true)} width={65} />
                <Tooltip
                  formatter={(v: number, name: string) => [formatCurrency(v), name]}
                  labelFormatter={(l: number) => `Year ${l}`}
                  contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="p90" name="90th pct" stroke="none" fill="url(#outerBand)" />
                <Area type="monotone" dataKey="p75" name="75th pct" stroke="none" fill="url(#innerBand)" />
                <Area type="monotone" dataKey="p50" name="Median" stroke="#6366F1" strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="p25" name="25th pct" stroke="none" fill="url(#innerBand)" />
                <Area type="monotone" dataKey="p10" name="10th pct" stroke="none" fill="url(#outerBand)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Click "Run Simulation" to generate results</p>
          </div>
        )}

        <div className="flex items-center gap-6 mt-3 justify-center">
          {[
            { label: '10–90th percentile', opacity: 0.15, isLine: false },
            { label: '25–75th percentile', opacity: 0.35, isLine: false },
            { label: 'Median (50th)', opacity: 1, isLine: true },
          ].map(({ label, opacity, isLine }) => (
            <div key={label} className="flex items-center gap-1.5">
              {isLine ? (
                <div className="w-4 h-0.5 rounded" style={{ background: '#6366F1' }} />
              ) : (
                <div className="w-3 h-3 rounded-sm" style={{ background: `rgba(99,102,241,${opacity})` }} />
              )}
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
