import { useMemo, useState } from 'react';
import { Plus, Target, AlertTriangle, Landmark, ArrowLeftRight } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { HealthScoreCard } from '../components/cards/HealthScoreCard';
import { NetWorthChart } from '../components/charts/NetWorthChart';
import { CashFlowChart } from '../components/charts/CashFlowChart';
import { SpendingPieChart } from '../components/charts/SpendingPieChart';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { TransactionForm } from '../components/forms/TransactionForm';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  calculateBudgetAdherenceRate,
  calculateCashFlowSeries,
  calculateMonthSummary,
  calculateNetWorth,
  calculateSpendingBreakdown,
  calculateTotalAssets,
  calculateTotalLiabilities,
  estimateNetWorthHistory,
} from '../lib/finance/cashflow';
import { calculateHealthScore } from '../lib/finance/healthScore';
import { getUpcomingBills, getSafeDailySpend } from '../lib/finance/cashflowForecast';
import { getCategoryTrends } from '../lib/finance/trends';
import { formatCurrency, formatPercent } from '../lib/utils/format';
import { cn } from '../lib/utils/cn';
import { recurrenceToMonthlyAmount } from '../lib/finance/onboarding';
import { EmptyState } from '../components/ui/EmptyState';

export function Dashboard() {
  const { accounts, budgets, categories, transactions, recurringExpenses, paychecks, goals, netWorthSnapshots } = useFinanceStore();
  const onboarding = useSettingsStore(s => s.onboarding);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const summary = useMemo(
    () => calculateMonthSummary(transactions, currentYear, currentMonth),
    [transactions, currentMonth, currentYear]
  );
  const fallbackMonthlyIncome = useMemo(() => {
    if (summary.totalIncome > 0) return summary.totalIncome;
    if (paychecks.length > 0) {
      return paychecks.reduce((sum, paycheck) => {
        const monthlyMultiplier = paycheck.frequency === 'weekly'
          ? 52 / 12
          : paycheck.frequency === 'biweekly'
          ? 26 / 12
          : paycheck.frequency === 'semimonthly'
          ? 2
          : 1;
        return sum + (paycheck.amount * monthlyMultiplier);
      }, 0);
    }
    return onboarding?.monthlyIncome ?? 0;
  }, [onboarding, paychecks, summary.totalIncome]);
  const fallbackMonthlyExpenses = useMemo(() => {
    if (summary.totalExpenses > 0) return summary.totalExpenses;
    return recurringExpenses.reduce((sum, expense) => sum + recurrenceToMonthlyAmount(expense), 0);
  }, [recurringExpenses, summary.totalExpenses]);
  const fallbackSavingsRate = useMemo(() => {
    if (summary.totalIncome > 0) return summary.savingsRate;
    if (fallbackMonthlyIncome <= 0) return 0;
    const plannedSavings = onboarding?.savingsGoalMonthly ?? 0;
    const netPlannedSavings = Math.max(plannedSavings, fallbackMonthlyIncome - fallbackMonthlyExpenses);
    return Math.max(0, Math.min(netPlannedSavings / fallbackMonthlyIncome, 1));
  }, [fallbackMonthlyExpenses, fallbackMonthlyIncome, onboarding, summary.savingsRate, summary.totalIncome]);
  const headlineCashFlow = useMemo(() => {
    if (summary.totalIncome > 0 || summary.totalExpenses > 0) return summary.netCashFlow;
    return fallbackMonthlyIncome - fallbackMonthlyExpenses;
  }, [fallbackMonthlyExpenses, fallbackMonthlyIncome, summary.netCashFlow, summary.totalExpenses, summary.totalIncome]);

  const netWorth = useMemo(() => calculateNetWorth(accounts), [accounts]);
  const totalAssets = useMemo(() => calculateTotalAssets(accounts), [accounts]);
  const totalLiabilities = useMemo(() => calculateTotalLiabilities(accounts), [accounts]);
  const cashFlowSeries = useMemo(
    () => calculateCashFlowSeries(transactions, 6, now),
    [transactions, currentMonth, currentYear]
  );
  const spendingBreakdown = useMemo(
    () => calculateSpendingBreakdown(transactions, categories, currentYear, currentMonth),
    [transactions, categories, currentMonth, currentYear]
  );

  const netWorthHistory = useMemo(() => {
    if (netWorthSnapshots.length >= 3) {
      return [...netWorthSnapshots].sort((a, b) => a.date.localeCompare(b.date)).slice(-13);
    }
    return estimateNetWorthHistory(accounts, transactions, 12, now);
  }, [accounts, transactions, currentMonth, currentYear, netWorthSnapshots]);

  const netWorthLabel = netWorthSnapshots.length >= 3
    ? `Based on ${netWorthSnapshots.length} snapshots`
    : 'Estimated from transactions';

  const budgetAdherenceRate = useMemo(
    () => calculateBudgetAdherenceRate(transactions, budgets, currentYear, currentMonth),
    [transactions, budgets, currentMonth, currentYear]
  );

  const healthScore = useMemo(() => calculateHealthScore({
    savingsRate: fallbackSavingsRate,
    monthlyExpenses: fallbackMonthlyExpenses,
    liquidAssets: accounts
      .filter(a => a.type === 'checking' || a.type === 'savings')
      .reduce((s, a) => s + a.balance, 0),
    totalDebt: totalLiabilities,
    monthlyIncome: fallbackMonthlyIncome,
    budgetAdherenceRate,
    hasInvestments: accounts.some(a => a.type === 'investment' || a.type === 'retirement'),
  }), [accounts, budgetAdherenceRate, fallbackMonthlyExpenses, fallbackMonthlyIncome, fallbackSavingsRate, totalLiabilities]);

  const checkingBalance = useMemo(
    () => accounts.filter(a => a.type === 'checking').reduce((s, a) => s + a.balance, 0),
    [accounts]
  );
  const upcomingBills = useMemo(() => getUpcomingBills(recurringExpenses, 30), [recurringExpenses]);
  const upcomingBillsTotal = upcomingBills.reduce((s, b) => s + b.amount, 0);
  const primaryPaycheck = paychecks[0];
  const daysUntilPaycheck = primaryPaycheck
    ? Math.max(differenceInDays(parseISO(primaryPaycheck.nextPayDate), now), 1)
    : 14;
  const safeDailySpend = getSafeDailySpend(checkingBalance, upcomingBillsTotal, daysUntilPaycheck);

  const spendingAlerts = useMemo(
    () => getCategoryTrends(transactions, categories, currentYear, currentMonth).filter(t => t.isAnomaly).slice(0, 3),
    [transactions, categories, currentMonth, currentYear]
  );

  const topGoals = goals.slice(0, 3);

  const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Net Worth</p>
          <p className="text-3xl font-semibold text-foreground tabular-nums">{formatCurrency(netWorth, 'USD', true)}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{formatCurrency(totalAssets, 'USD', true)} assets / {formatCurrency(totalLiabilities, 'USD', true)} debt</p>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{currentMonthName} Cash Flow</p>
          <p className={cn('text-3xl font-semibold tabular-nums', headlineCashFlow >= 0 ? 'text-foreground' : 'text-negative')}>
            {headlineCashFlow >= 0 ? '+' : ''}{formatCurrency(headlineCashFlow)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {formatCurrency(fallbackMonthlyIncome)} income / {formatCurrency(fallbackMonthlyExpenses)} expenses
          </p>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
          <p className={cn('text-3xl font-semibold tabular-nums', fallbackSavingsRate >= 0.20 ? 'text-positive' : fallbackSavingsRate >= 0.10 ? 'text-foreground' : 'text-negative')}>
            {formatPercent(fallbackSavingsRate)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">Target: 20% / {fallbackSavingsRate >= 0.20 ? 'On track' : 'Below target'}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Safe to Spend Today</p>
          <p className={cn(
            'text-3xl font-semibold tabular-nums',
            safeDailySpend < 0 ? 'text-negative' : safeDailySpend < 20 ? 'text-amber-500' : 'text-foreground'
          )}>
            {formatCurrency(safeDailySpend)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {primaryPaycheck ? `${daysUntilPaycheck}d until paycheck` : 'No paycheck scheduled'}
          </p>
        </div>
      </div>

      {upcomingBills.length > 0 && (
        <div className="bg-surface border border-border rounded-lg shadow-card">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Bills</h2>
            <span className="text-xs text-muted-foreground">{formatCurrency(upcomingBillsTotal)} due in 30 days</span>
          </div>
          <div className="divide-y divide-border">
            {upcomingBills.slice(0, 5).map(b => {
              const days = differenceInDays(parseISO(b.nextDueDate), now);
              return (
                <div key={b.id} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{b.recurrence}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(b.amount)}</p>
                    <p className={cn('text-xs', days <= 3 ? 'text-negative' : days <= 7 ? 'text-amber-500' : 'text-muted-foreground')}>
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days}d`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {spendingAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">Spending Alerts</h2>
          </div>
          <div className="space-y-1.5">
            {spendingAlerts.map(t => (
              <div key={t.categoryId} className="flex items-center justify-between text-xs">
                <span className="text-amber-800 font-medium">{t.categoryName}</span>
                <span className="text-amber-700">
                  {formatCurrency(t.thisMonth)} this month vs {formatCurrency(t.threeMonthAvg)} avg
                  {' '}({t.delta > 0 ? '+' : ''}{formatPercent(t.deltaPercent, 0)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg shadow-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Net Worth</h2>
              <p className="text-xs text-muted-foreground">{netWorthLabel}</p>
            </div>
          </div>
          <div className="h-52">
            <NetWorthChart data={netWorthHistory} />
          </div>
        </div>
        <HealthScoreCard score={healthScore} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg shadow-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Cash Flow</h2>
          <p className="text-xs text-muted-foreground mb-4">Income, expenses, and savings by month</p>
          <div className="h-52">
            <CashFlowChart data={cashFlowSeries} />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Spending</h2>
          <p className="text-xs text-muted-foreground mb-4">This month by category</p>
          <SpendingPieChart data={spendingBreakdown} />
        </div>
      </div>

      {topGoals.length > 0 && (
        <div className="bg-surface border border-border rounded-lg shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Goals</h2>
            <a href="/goals" className="text-xs text-brand hover:underline">View all</a>
          </div>
          <div className="divide-y divide-border">
            {topGoals.map(g => {
              const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
              return (
                <div key={g.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Target size={13} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-positive' : 'bg-brand')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Accounts</h2>
            <span className="text-xs text-muted-foreground">{formatCurrency(netWorth)} total</span>
          </div>
          <div className="divide-y divide-border">
            {accounts.length > 0 ? accounts.map(account => (
              <div key={account.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{account.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{account.type}{account.institution ? ` / ${account.institution}` : ''}</p>
                </div>
                <span className={cn('text-sm font-semibold tabular-nums', account.balance < 0 ? 'text-negative' : 'text-foreground')}>
                  {account.balance < 0 ? '-' : ''}{formatCurrency(Math.abs(account.balance))}
                </span>
              </div>
            )) : (
              <EmptyState
                icon={Landmark}
                title="No accounts yet"
                description="Add your first account or connect a bank to start seeing balances and net worth here."
              />
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
            <Button size="sm" variant="ghost" onClick={() => setTxnModalOpen(true)}>
              <Plus size={13} />Add
            </Button>
          </div>
          <div className="divide-y divide-border">
            {transactions.length > 0 ? transactions.slice(0, 8).map(txn => (
              <div key={txn.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">{txn.date}</p>
                </div>
                <span className={cn('text-sm font-semibold tabular-nums ml-3 flex-shrink-0', txn.type === 'income' ? 'text-positive' : 'text-foreground')}>
                  {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
              </div>
            )) : (
              <EmptyState
                icon={ArrowLeftRight}
                title="No transactions yet"
                description="Import transactions, connect a bank, or add one manually to start building your history."
                action={{ label: 'Add Transaction', onClick: () => setTxnModalOpen(true) }}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={txnModalOpen} onOpenChange={setTxnModalOpen} title="New Transaction">
        <TransactionForm onSuccess={() => setTxnModalOpen(false)} onCancel={() => setTxnModalOpen(false)} />
      </Modal>
    </div>
  );
}
