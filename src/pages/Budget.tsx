import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { getBudgetSpending } from '../lib/finance/budget';
import { formatCurrency } from '../lib/utils/format';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { BudgetForm } from '../components/forms/BudgetForm';
import type { Budget } from '../types/finance';
import { cn } from '../lib/utils/cn';

export function Budget() {
  const { budgets, transactions, categories, deleteBudget } = useFinanceStore();
  const now = new Date();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const budgetData = useMemo(
    () => getBudgetSpending(budgets, transactions, now.getFullYear(), now.getMonth() + 1),
    [budgets, transactions]
  );

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? id;

  const totalBudget = budgetData.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (budget: Budget) => { setEditing(budget); setModalOpen(true); };
  const handleDelete = (id: string) => {
    if (confirm('Delete this budget?')) deleteBudget(id);
  };

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: formatCurrency(totalBudget), color: 'text-foreground' },
          { label: 'Spent', value: formatCurrency(totalSpent), color: 'text-foreground' },
          { label: 'Remaining', value: formatCurrency(totalRemaining), color: totalRemaining >= 0 ? 'text-positive' : 'text-negative' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={cn('text-2xl font-semibold mt-1 tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="bg-surface border border-border rounded-lg shadow-card p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Overall Budget Usage</span>
          <span className="text-sm font-medium tabular-nums text-foreground">{overallPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500',
              overallPct > 100 ? 'bg-negative' : overallPct > 80 ? 'bg-warning' : 'bg-positive'
            )}
            style={{ width: `${Math.min(overallPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Category budgets */}
      <div className="bg-surface border border-border rounded-lg shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Category Budgets</h2>
          <Button size="sm" onClick={openAdd}><Plus size={13} />Add Budget</Button>
        </div>
        {budgetData.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No budgets yet</p>
            <button onClick={openAdd} className="mt-2 text-xs text-brand hover:underline">Create your first budget</button>
          </div>
        )}
        <div className="divide-y divide-border">
          {budgetData.map(budget => (
            <div key={budget.id} className="px-5 py-4 group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{getCategoryName(budget.categoryId)}</span>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground tabular-nums flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{formatCurrency(budget.spent)}</span>
                    <span>/</span>
                    <span>{formatCurrency(budget.amount)}</span>
                    <span className={cn('ml-1 font-medium', budget.remaining >= 0 ? 'text-muted-foreground' : 'text-negative')}>
                      {budget.remaining >= 0 ? `${formatCurrency(budget.remaining)} left` : `${formatCurrency(Math.abs(budget.remaining))} over`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(budget)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(budget.id)} className="p-1.5 rounded text-muted-foreground hover:text-negative hover:bg-red-50 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500',
                    budget.percentage > 100 ? 'bg-negative' : budget.percentage > 80 ? 'bg-warning' : 'bg-brand'
                  )}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Budget' : 'New Budget'}>
        <BudgetForm
          initial={editing ?? undefined}
          onSuccess={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
