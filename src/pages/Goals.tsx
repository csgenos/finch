import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Target, TrendingDown } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useFinanceStore } from '../store/useFinanceStore';
import { Goal, GoalCategory } from '../types/goals';
import { formatCurrency } from '../lib/utils/format';
import { generateId } from '../lib/storage/localStore';
import { toast } from '../lib/utils/toast';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils/cn';
import { parseMoney } from '../lib/utils/numbers';

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  emergency_fund: 'Emergency Fund',
  vacation: 'Vacation',
  home: 'Home',
  education: 'Education',
  retirement: 'Retirement',
  car: 'Car',
  debt_payoff: 'Debt Payoff',
  other: 'Other',
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  emergency_fund: 'bg-green-100 text-green-700',
  vacation: 'bg-blue-100 text-blue-700',
  home: 'bg-orange-100 text-orange-700',
  education: 'bg-purple-100 text-purple-700',
  retirement: 'bg-indigo-100 text-indigo-700',
  car: 'bg-slate-100 text-slate-700',
  debt_payoff: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
};

const categoryOptions = (Object.keys(CATEGORY_LABELS) as GoalCategory[]).map(k => ({
  value: k,
  label: CATEGORY_LABELS[k],
}));

interface GoalFormState {
  name: string;
  category: GoalCategory;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  accountId: string;
  notes: string;
}

function GoalForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Partial<Goal>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { accounts, addGoal, updateGoal } = useFinanceStore();
  const isEditing = !!initial?.id;

  const [form, setForm] = useState<GoalFormState>({
    name: initial?.name ?? '',
    category: initial?.category ?? 'other',
    targetAmount: initial?.targetAmount?.toString() ?? '',
    currentAmount: initial?.currentAmount?.toString() ?? '0',
    targetDate: initial?.targetDate ?? '',
    accountId: initial?.accountId ?? '',
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<Partial<GoalFormState>>({});

  const accountOptions = [
    { value: '', label: 'No linked account' },
    ...accounts.map(a => ({ value: a.id, label: a.name })),
  ];

  const validate = () => {
    const errs: Partial<GoalFormState> = {};
    if (!form.name.trim()) errs.name = 'Required';
    const targetAmount = parseMoney(form.targetAmount);
    const currentAmount = parseMoney(form.currentAmount);
    if (targetAmount === null || targetAmount <= 0) errs.targetAmount = 'Enter a positive amount';
    if (form.currentAmount && currentAmount === null) errs.currentAmount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const goal: Goal = {
      id: initial?.id ?? generateId(),
      name: form.name.trim(),
      category: form.category,
      targetAmount: parseMoney(form.targetAmount)!,
      currentAmount: parseMoney(form.currentAmount) ?? 0,
      targetDate: form.targetDate || undefined,
      accountId: form.accountId || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    if (isEditing) {
      updateGoal(goal.id, goal);
      toast('Goal updated');
    } else {
      addGoal(goal);
      toast('Goal added');
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Goal Name"
        placeholder="e.g. Europe Trip 2026"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        error={errors.name}
      />
      <Select
        label="Category"
        value={form.category}
        onValueChange={v => setForm(f => ({ ...f, category: v as GoalCategory }))}
        options={categoryOptions}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Target Amount"
          type="number"
          placeholder="0.00"
          value={form.targetAmount}
          onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
          error={errors.targetAmount}
        />
        <Input
          label="Current Savings"
          type="number"
          placeholder="0.00"
          value={form.currentAmount}
          onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))}
        />
      </div>
      <Input
        label="Target Date (optional)"
        type="date"
        value={form.targetDate}
        onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
      />
      <Select
        label="Linked Account (optional)"
        value={form.accountId}
        onValueChange={v => setForm(f => ({ ...f, accountId: v }))}
        options={accountOptions}
      />
      <Input
        label="Notes (optional)"
        placeholder="Any additional notes"
        value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEditing ? 'Save Changes' : 'Add Goal'}</Button>
      </div>
    </form>
  );
}

function DebtPayoffPlanner() {
  const { accounts } = useFinanceStore();
  const [method, setMethod] = useState<'snowball' | 'avalanche'>('snowball');
  const [monthlyPayment, setMonthlyPayment] = useState('500');

  const debtAccounts = useMemo(
    () => accounts.filter(a => (a.type === 'credit' || a.type === 'loan') && a.balance < 0)
      .map(a => ({ ...a, balance: Math.abs(a.balance) }))
      .sort((a, b) => method === 'snowball' ? a.balance - b.balance : b.balance - a.balance),
    [accounts, method]
  );

  const totalDebt = debtAccounts.reduce((s, a) => s + a.balance, 0);
  const payment = parseMoney(monthlyPayment) ?? 0;

  const payoffMonths = useMemo(() => {
    if (payment <= 0 || totalDebt <= 0) return null;
    let remaining = debtAccounts.map(a => ({ ...a }));
    let months = 0;
    while (remaining.some(r => r.balance > 0) && months < 600) {
      let budget = payment;
      for (const r of remaining) {
        if (r.balance <= 0) continue;
        const pay = Math.min(r.balance, budget);
        r.balance -= pay;
        budget -= pay;
        if (budget <= 0) break;
      }
      remaining = remaining.filter(r => r.balance > 0);
      months++;
    }
    return months < 600 ? months : null;
  }, [debtAccounts, payment]);

  if (debtAccounts.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-lg shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Debt Payoff Planner</h2>
          <p className="text-xs text-muted-foreground">{formatCurrency(totalDebt)} total debt across {debtAccounts.length} accounts</p>
        </div>
        <div className="flex bg-muted rounded-md p-0.5">
          {(['snowball', 'avalanche'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors',
                method === m ? 'bg-surface text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Monthly Payment Budget</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              value={monthlyPayment}
              onChange={e => setMonthlyPayment(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
        {payoffMonths !== null && (
          <div className="text-sm">
            <span className="text-muted-foreground">Debt-free in </span>
            <span className="font-semibold text-foreground">
              {payoffMonths >= 12 ? `${Math.floor(payoffMonths / 12)}y ${payoffMonths % 12}m` : `${payoffMonths}mo`}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {method === 'snowball'
          ? 'Snowball: Pay minimums on all debts, put extra toward smallest balance first.'
          : 'Avalanche: Pay minimums on all debts, put extra toward largest balance first.'}
      </p>

      <div className="space-y-2">
        {debtAccounts.map((a, i) => (
          <div key={a.id} className="flex items-center gap-3 text-xs">
            <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground flex-shrink-0">{i + 1}</span>
            <span className="flex-1 text-foreground font-medium truncate">{a.name}</span>
            <span className="text-muted-foreground">{a.institution ?? a.type}</span>
            <span className="font-semibold tabular-nums text-negative">{formatCurrency(a.balance)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Goals() {
  const { goals, accounts, deleteGoal } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (g: Goal) => { setEditing(g); setModalOpen(true); };

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs text-muted-foreground">Total Saved</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs text-muted-foreground">Total Target</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs text-muted-foreground">Overall Progress</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{overallPct.toFixed(0)}%</p>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Financial Goals</h2>
          <Button size="sm" onClick={openAdd}><Plus size={13} />Add Goal</Button>
        </div>

        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set savings goals to track your progress toward big purchases, emergency funds, and retirement."
            action={{ label: 'Add Goal', onClick: openAdd }}
          />
        ) : (
          <div className="divide-y divide-border">
            {goals.map(g => {
              const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
              const remaining = g.targetAmount - g.currentAmount;
              const linkedAccount = accounts.find(a => a.id === g.accountId);
              let daysLeft: number | null = null;
              let monthsLeft: number | null = null;
              if (g.targetDate) {
                daysLeft = differenceInDays(parseISO(g.targetDate), new Date());
                monthsLeft = Math.ceil(daysLeft / 30);
              }

              return (
                <div key={g.id} className="px-5 py-4 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', CATEGORY_COLORS[g.category])}>
                        {CATEGORY_LABELS[g.category]}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{g.name}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(g)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteConfirm(g.id)} className="p-1.5 rounded text-muted-foreground hover:text-negative hover:bg-red-50 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', pct >= 100 ? 'bg-positive' : 'bg-brand')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">{formatCurrency(g.currentAmount)}</span>
                        {' '}/{' '}{formatCurrency(g.targetAmount)}
                      </span>
                      {remaining > 0 && (
                        <span>{formatCurrency(remaining)} to go</span>
                      )}
                      {linkedAccount && (
                        <span className="text-brand">→ {linkedAccount.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {pct >= 100 && <span className="text-positive font-medium">Complete!</span>}
                      {daysLeft !== null && daysLeft > 0 && (
                        <span>
                          {monthsLeft! >= 12
                            ? `${Math.floor(monthsLeft! / 12)}y ${monthsLeft! % 12}mo left`
                            : `${monthsLeft}mo left`}
                        </span>
                      )}
                      {daysLeft !== null && daysLeft <= 0 && pct < 100 && (
                        <span className="text-negative font-medium">Past deadline</span>
                      )}
                      <span className="font-semibold text-foreground">{pct.toFixed(0)}%</span>
                    </div>
                  </div>

                  {g.notes && (
                    <p className="text-xs text-muted-foreground mt-1.5">{g.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DebtPayoffPlanner />

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Goal' : 'Add Goal'}
      >
        <GoalForm
          initial={editing ?? undefined}
          onSuccess={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={open => !open && setDeleteConfirm(null)}
        title="Delete Goal"
        description="This goal will be removed permanently."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteConfirm) {
            deleteGoal(deleteConfirm);
            toast('Goal removed', 'info');
          }
          setDeleteConfirm(null);
        }}
      />
    </div>
  );
}
