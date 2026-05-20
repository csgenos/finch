import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { HealthScoreCard } from '../components/cards/HealthScoreCard';
import { NetWorthChart } from '../components/charts/NetWorthChart';
import { CashFlowChart } from '../components/charts/CashFlowChart';
import { SpendingPieChart } from '../components/charts/SpendingPieChart';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { TransactionForm } from '../components/forms/TransactionForm';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  calculateMonthSummary,
  calculateNetWorth,
  calculateTotalAssets,
  calculateTotalLiabilities,
} from '../lib/finance/cashflow';
import { calculateHealthScore } from '../lib/finance/healthScore';
import { formatCurrency, formatPercent } from '../lib/utils/format';
import { sampleNetWorthHistory, sampleMonthlyExpenses, sampleSpendingBreakdown } from '../data/sampleData';
import { cn } from '../lib/utils/cn';

export function Dashboard() {
  const { accounts, transactions } = useFinanceStore();
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const now = new Date();

  const summary = useMemo(
    () => calculateMonthSummary(transactions, now.getFullYear(), now.getMonth() + 1),
    [transactions]
  );

  const netWorth = useMemo(() => calculateNetWorth(accounts), [accounts]);
  const totalAssets = useMemo(() => calculateTotalAssets(accounts), [accounts]);
  const totalLiabilities = useMemo(() => calculateTotalLiabilities(accounts), [accounts]);

  const healthScore = useMemo(() => calculateHealthScore({
    savingsRate: summary.savingsRate,
    monthlyExpenses: summary.totalExpenses,
    liquidAssets: accounts
      .filter(a => a.type === 'checking' || a.type === 'savings')
      .reduce((s, a) => s + a.balance, 0),
    totalDebt: totalLiabilities,
    monthlyIncome: summary.totalIncome,
    budgetAdherenceRate: 0.82,
    hasInvestments: accounts.some(a => a.type === 'investment' || a.type === 'retirement'),
  }), [accounts, summary, totalLiabilities]);

  const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto">
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Net Worth</p>
          <p className="text-3xl font-semibold text-foreground tabular-nums">{formatCurrency(netWorth, 'USD', true)}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{formatCurrency(totalAssets, 'USD', true)} assets · {formatCurrency(totalLiabilities, 'USD', true)} debt</p>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{currentMonthName} Cash Flow</p>
          <p className={cn('text-3xl font-semibold tabular-nums', summary.netCashFlow >= 0 ? 'text-foreground' : 'text-negative')}>
            {summary.netCashFlow >= 0 ? '+' : ''}{formatCurrency(summary.netCashFlow)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {formatCurrency(summary.totalIncome)} income · {formatCurrency(summary.totalExpenses)} expenses
          </p>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
          <p className={cn('text-3xl font-semibold tabular-nums', summary.savingsRate >= 0.20 ? 'text-positive' : summary.savingsRate >= 0.10 ? 'text-foreground' : 'text-negative')}>
            {formatPercent(summary.savingsRate)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">Target: 20% · {summary.savingsRate >= 0.20 ? 'On track' : 'Below target'}</p>
        </div>
      </div>

      {/* Net Worth + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg shadow-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Net Worth</h2>
              <p className="text-xs text-muted-foreground">12-month trend</p>
            </div>
          </div>
          <div className="h-52">
            <NetWorthChart data={sampleNetWorthHistory} />
          </div>
        </div>
        <HealthScoreCard score={healthScore} />
      </div>

      {/* Cash Flow + Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg shadow-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Cash Flow</h2>
          <p className="text-xs text-muted-foreground mb-4">Income, expenses, and savings by month</p>
          <div className="h-52">
            <CashFlowChart data={sampleMonthlyExpenses} />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Spending</h2>
          <p className="text-xs text-muted-foreground mb-4">This month by category</p>
          <SpendingPieChart data={sampleSpendingBreakdown} />
        </div>
      </div>

      {/* Accounts + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Accounts</h2>
            <span className="text-xs text-muted-foreground">{formatCurrency(netWorth)} total</span>
          </div>
          <div className="divide-y divide-border">
            {accounts.map(account => (
              <div key={account.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{account.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{account.type}{account.institution ? ` · ${account.institution}` : ''}</p>
                </div>
                <span className={cn('text-sm font-semibold tabular-nums', account.balance < 0 ? 'text-negative' : 'text-foreground')}>
                  {account.balance < 0 ? '−' : ''}{formatCurrency(Math.abs(account.balance))}
                </span>
              </div>
            ))}
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
            {transactions.slice(0, 8).map(txn => (
              <div key={txn.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">{txn.date}</p>
                </div>
                <span className={cn('text-sm font-semibold tabular-nums ml-3 flex-shrink-0', txn.type === 'income' ? 'text-positive' : 'text-foreground')}>
                  {txn.type === 'income' ? '+' : '−'}{formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={txnModalOpen} onOpenChange={setTxnModalOpen} title="New Transaction">
        <TransactionForm onSuccess={() => setTxnModalOpen(false)} onCancel={() => setTxnModalOpen(false)} />
      </Modal>
    </div>
  );
}
