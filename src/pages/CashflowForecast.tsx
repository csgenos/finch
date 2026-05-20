import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  buildCashflowForecast,
  getLowestProjectedBalance,
  getNegativeDates,
} from '../lib/finance/cashflowForecast';
import { formatCurrency } from '../lib/utils/format';
import { cn } from '../lib/utils/cn';

export function CashflowForecast() {
  const { accounts, paychecks, recurringExpenses } = useFinanceStore();
  const [days, setDays] = useState<30 | 60 | 90>(60);

  const checkingBalance = useMemo(
    () =>
      accounts
        .filter(a => a.type === 'checking' || a.type === 'savings')
        .reduce((s, a) => s + Math.max(0, a.balance), 0),
    [accounts]
  );

  const forecast = useMemo(
    () => buildCashflowForecast(checkingBalance, paychecks, recurringExpenses, days),
    [checkingBalance, paychecks, recurringExpenses, days]
  );

  const { balance: lowestBalance, date: lowestDate } = useMemo(
    () => getLowestProjectedBalance(forecast),
    [forecast]
  );

  const negativeDates = useMemo(() => getNegativeDates(forecast), [forecast]);

  const chartData = forecast
    .filter((_, i) => i % (days === 30 ? 1 : 2) === 0)
    .map(p => ({
      date: format(parseISO(p.date), 'MMM d'),
      balance: p.projectedBalance,
      inflows: p.inflows,
      outflows: p.outflows,
    }));

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground">Current Liquid Balance</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">
            {formatCurrency(checkingBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {accounts.filter(a => a.type === 'checking' || a.type === 'savings').length} accounts
          </p>
        </div>
        <div
          className={cn(
            'bg-surface border rounded-lg shadow-card p-5',
            lowestBalance < 0 ? 'border-red-200' : 'border-border'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs text-muted-foreground">Lowest Projected Balance</p>
            {lowestBalance < 0 && <AlertTriangle size={12} className="text-negative" />}
          </div>
          <p
            className={cn(
              'text-2xl font-semibold tabular-nums mt-1',
              lowestBalance < 0 ? 'text-negative' : 'text-foreground'
            )}
          >
            {formatCurrency(lowestBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {lowestDate ? format(parseISO(lowestDate), 'MMM d') : '—'}
          </p>
        </div>
        <div
          className={cn(
            'bg-surface border rounded-lg shadow-card p-5',
            negativeDates.length > 0 ? 'border-red-200' : 'border-border'
          )}
        >
          <p className="text-xs text-muted-foreground">Negative Balance Days</p>
          <p
            className={cn(
              'text-2xl font-semibold tabular-nums mt-1',
              negativeDates.length > 0 ? 'text-negative' : 'text-positive'
            )}
          >
            {negativeDates.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {negativeDates.length === 0 ? 'No shortfalls projected' : 'days below $0'}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {negativeDates.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <TrendingDown size={16} className="text-negative flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-negative">Cash shortfall projected</p>
            <p className="text-xs text-red-700 mt-0.5">
              Your balance is projected to go negative on{' '}
              {format(parseISO(negativeDates[0]), 'MMMM d')}. Consider moving funds, reducing
              spending, or adjusting bill dates.
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-surface border border-border rounded-lg shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Projected Cash Balance</h2>
            <p className="text-xs text-muted-foreground">Includes paychecks and recurring bills</p>
          </div>
          <div className="flex bg-muted rounded-md p-0.5">
            {([30, 60, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                  days === d
                    ? 'bg-surface text-foreground shadow-subtle'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => formatCurrency(v, 'USD', true)}
                width={60}
              />
              <ReferenceLine y={0} stroke="#DC2626" strokeDasharray="4 4" strokeWidth={1} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  formatCurrency(v),
                  name === 'balance' ? 'Projected Balance' : name,
                ]}
                contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#balanceGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming events */}
      {forecast.some(p => p.events.length > 0) && (
        <div className="bg-surface border border-border rounded-lg shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Events</h2>
          </div>
          <div className="divide-y divide-border">
            {forecast
              .filter(p => p.events.length > 0)
              .slice(0, 15)
              .map(point =>
                point.events.map((ev, i) => (
                  <div
                    key={`${point.date}-${i}`}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{ev.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(point.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        ev.amount > 0 ? 'text-positive' : 'text-foreground'
                      )}
                    >
                      {ev.amount > 0 ? '+' : '−'}
                      {formatCurrency(Math.abs(ev.amount))}
                    </span>
                  </div>
                ))
              )}
          </div>
        </div>
      )}
    </div>
  );
}
