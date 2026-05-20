import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, CheckCircle, RotateCcw, AlertTriangle, Zap } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useFinanceStore } from '../store/useFinanceStore';
import { RecurringExpense, RecurrenceRule } from '../types/planning';
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

const recurrenceOptions: { value: RecurrenceRule; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'semimonthly', label: 'Twice a month' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

function BillForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Partial<RecurringExpense>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { categories, accounts, addRecurringExpense, updateRecurringExpense } = useFinanceStore();
  const isEditing = !!initial?.id;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    amount: initial?.amount?.toString() ?? '',
    categoryId:
      initial?.categoryId ?? (categories.find(c => c.type === 'expense')?.id ?? ''),
    accountId: initial?.accountId ?? '',
    recurrence: (initial?.recurrence ?? 'monthly') as RecurrenceRule,
    nextDueDate: initial?.nextDueDate ?? format(new Date(), 'yyyy-MM-dd'),
    autopay: initial?.autopay ?? false,
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expenseCategories = categories
    .filter(c => c.type === 'expense')
    .map(c => ({ value: c.id, label: c.name }));
  const accountOptions = [
    { value: '', label: 'Any account' },
    ...accounts.map(a => ({ value: a.id, label: a.name })),
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Required';
    const amount = parseMoney(form.amount);
    if (amount === null || amount <= 0) errs.amount = 'Enter a positive amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const expense: RecurringExpense = {
      id: initial?.id ?? generateId(),
      name: form.name.trim(),
      amount: parseMoney(form.amount)!,
      categoryId: form.categoryId,
      accountId: form.accountId,
      recurrence: form.recurrence,
      nextDueDate: form.nextDueDate,
      autopay: form.autopay,
      status: 'upcoming',
      notes: form.notes.trim() || undefined,
    };
    if (isEditing) {
      updateRecurringExpense(expense.id, expense);
      toast('Bill updated');
    } else {
      addRecurringExpense(expense);
      toast('Bill added');
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        placeholder="e.g. Netflix, Rent, Car Insurance"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        error={errors.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount"
          type="number"
          placeholder="0.00"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          error={errors.amount}
        />
        <Select
          label="Recurrence"
          value={form.recurrence}
          onValueChange={v => setForm(f => ({ ...f, recurrence: v as RecurrenceRule }))}
          options={recurrenceOptions}
        />
      </div>
      <Input
        label="Next Due Date"
        type="date"
        value={form.nextDueDate}
        onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))}
      />
      <Select
        label="Category"
        value={form.categoryId}
        onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}
        options={expenseCategories}
      />
      <Select
        label="Account"
        value={form.accountId}
        onValueChange={v => setForm(f => ({ ...f, accountId: v }))}
        options={accountOptions}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autopay"
          checked={form.autopay}
          onChange={e => setForm(f => ({ ...f, autopay: e.target.checked }))}
          className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
        />
        <label htmlFor="autopay" className="text-sm text-foreground">
          Autopay enabled
        </label>
      </div>
      <Input
        label="Notes (optional)"
        value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? 'Save Changes' : 'Add Bill'}</Button>
      </div>
    </form>
  );
}

export function Bills() {
  const { recurringExpenses, deleteRecurringExpense, markRecurringPaid } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'paid'>('all');

  const filtered = useMemo(
    () => recurringExpenses.filter(r => filter === 'all' || r.status === filter),
    [recurringExpenses, filter]
  );

  const totalMonthly = useMemo(() => {
    return recurringExpenses.reduce((sum, r) => {
      const mult =
        r.recurrence === 'yearly' ? 1 / 12
        : r.recurrence === 'quarterly' ? 1 / 3
        : r.recurrence === 'weekly' ? 4.33
        : r.recurrence === 'biweekly' ? 2.17
        : r.recurrence === 'semimonthly' ? 2
        : 1;
      return sum + r.amount * mult;
    }, 0);
  }, [recurringExpenses]);

  const dueSoon = useMemo(
    () =>
      recurringExpenses.filter(r => {
        if (r.status === 'paid') return false;
        const days = differenceInDays(parseISO(r.nextDueDate), new Date());
        return days >= 0 && days <= 7;
      }),
    [recurringExpenses]
  );

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: RecurringExpense) => { setEditing(r); setModalOpen(true); };

  const getDueLabel = (dateStr: string) => {
    const days = differenceInDays(parseISO(dateStr), new Date());
    if (days < 0) return { label: 'Overdue', className: 'text-negative' };
    if (days === 0) return { label: 'Due today', className: 'text-negative' };
    if (days <= 3) return { label: `Due in ${days}d`, className: 'text-warning' };
    if (days <= 7) return { label: `Due in ${days}d`, className: 'text-foreground' };
    return { label: format(parseISO(dateStr), 'MMM d'), className: 'text-muted-foreground' };
  };

  const annualTotal = totalMonthly * 12;
  const autopayCount = recurringExpenses.filter(r => r.autopay).length;
  const activeCount = recurringExpenses.filter(r => r.status !== 'paid').length;

  const topBills = useMemo(() => {
    return [...recurringExpenses]
      .map(r => {
        const mult =
          r.recurrence === 'yearly' ? 1 / 12
          : r.recurrence === 'quarterly' ? 1 / 3
          : r.recurrence === 'weekly' ? 4.33
          : r.recurrence === 'biweekly' ? 2.17
          : r.recurrence === 'semimonthly' ? 2
          : 1;
        return { ...r, monthlyEquiv: r.amount * mult };
      })
      .sort((a, b) => b.monthlyEquiv - a.monthlyEquiv)
      .slice(0, 3);
  }, [recurringExpenses]);

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground">Monthly Total</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">
            {formatCurrency(totalMonthly)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{formatCurrency(annualTotal)} / year</p>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground">Due This Week</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-semibold text-foreground tabular-nums">{dueSoon.length}</p>
            {dueSoon.length > 0 && <AlertTriangle size={16} className="text-warning" />}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-5">
          <p className="text-xs text-muted-foreground">Active Bills</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{autopayCount} autopay · {activeCount - autopayCount} manual</p>
        </div>
      </div>

      {topBills.length > 0 && (
        <div className="bg-surface border border-border rounded-lg shadow-card px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground mb-2.5">Largest Commitments</p>
          <div className="flex flex-wrap gap-2">
            {topBills.map(r => (
              <span key={r.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-xs font-medium text-foreground">
                <span>{r.name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="tabular-nums">{formatCurrency(r.monthlyEquiv)}/mo</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">Recurring Bills</h2>
            <div className="flex bg-muted rounded-md p-0.5">
              {(['all', 'upcoming', 'paid'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors',
                    filter === f
                      ? 'bg-surface text-foreground shadow-subtle'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus size={13} />
            Add Bill
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No bills yet"
            description="Add your recurring bills to track what's coming up and avoid surprises."
            action={{ label: 'Add Bill', onClick: openAdd }}
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(r => {
              const { label, className } = getDueLabel(r.nextDueDate);
              return (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        r.status === 'paid'
                          ? 'bg-positive'
                          : differenceInDays(parseISO(r.nextDueDate), new Date()) <= 3
                          ? 'bg-warning'
                          : 'bg-border'
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                        {r.autopay && (
                          <Zap size={11} className="text-brand flex-shrink-0" aria-label="Autopay" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{r.recurrence}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={cn('text-xs font-medium', className)}>{label}</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrency(r.amount)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.status !== 'paid' && (
                        <button
                          onClick={() => { markRecurringPaid(r.id); toast(`${r.name} marked as paid`); }}
                          className="p-1.5 rounded text-muted-foreground hover:text-positive hover:bg-green-50 transition-colors"
                          title="Mark paid"
                        >
                          <CheckCircle size={12} />
                        </button>
                      )}
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteConfirm(r.id)} className="p-1.5 rounded text-muted-foreground hover:text-negative hover:bg-red-50 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Bill' : 'New Recurring Bill'}>
        <BillForm initial={editing ?? undefined} onSuccess={() => setModalOpen(false)} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={open => !open && setDeleteConfirm(null)}
        title="Delete Bill"
        description="This recurring bill will be removed permanently."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteConfirm) { deleteRecurringExpense(deleteConfirm); toast('Bill removed', 'info'); }
          setDeleteConfirm(null);
        }}
      />
    </div>
  );
}
