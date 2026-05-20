import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, DollarSign, AlertTriangle } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { useFinanceStore } from '../store/useFinanceStore';
import { PaycheckSchedule } from '../types/planning';
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
import { getUpcomingBills, getSafeDailySpend } from '../lib/finance/cashflowForecast';

const freqOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'semimonthly', label: 'Semimonthly' },
  { value: 'monthly', label: 'Monthly' },
];

const allocColors: Record<string, string> = {
  bills: 'bg-blue-100 text-blue-700',
  spending: 'bg-amber-100 text-amber-700',
  savings: 'bg-green-100 text-green-700',
  debt: 'bg-red-100 text-red-700',
  investing: 'bg-purple-100 text-purple-700',
};

interface PaycheckFormState {
  name: string;
  amount: string;
  frequency: string;
  nextPayDate: string;
  accountId: string;
  taxWithheld: string;
}

function PaycheckForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Partial<PaycheckSchedule>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { accounts, addPaycheck, updatePaycheck } = useFinanceStore();
  const isEditing = !!initial?.id;
  const [form, setForm] = useState<PaycheckFormState>({
    name: initial?.name ?? 'Primary Job',
    amount: initial?.amount?.toString() ?? '',
    frequency: initial?.frequency ?? 'biweekly',
    nextPayDate: initial?.nextPayDate ?? format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    accountId: initial?.accountId ?? (accounts[0]?.id ?? ''),
    taxWithheld: initial?.taxWithheld?.toString() ?? '',
  });
  const [errors, setErrors] = useState<Partial<PaycheckFormState>>({});
  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));

  const validate = () => {
    const errs: Partial<PaycheckFormState> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter a positive amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const paycheck: PaycheckSchedule = {
      id: initial?.id ?? generateId(),
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      frequency: form.frequency as PaycheckSchedule['frequency'],
      nextPayDate: form.nextPayDate,
      accountId: form.accountId,
      taxWithheld: form.taxWithheld ? parseFloat(form.taxWithheld) : undefined,
    };
    if (isEditing) {
      updatePaycheck(paycheck.id, paycheck);
      toast('Paycheck updated');
    } else {
      addPaycheck(paycheck);
      toast('Paycheck added');
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        placeholder="e.g. Primary Job"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        error={errors.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Net Amount (after tax)"
          type="number"
          placeholder="0.00"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          error={errors.amount}
        />
        <Input
          label="Tax Withheld (optional)"
          type="number"
          placeholder="0.00"
          value={form.taxWithheld}
          onChange={e => setForm(f => ({ ...f, taxWithheld: e.target.value }))}
        />
      </div>
      <Select
        label="Pay Frequency"
        value={form.frequency}
        onValueChange={v => setForm(f => ({ ...f, frequency: v }))}
        options={freqOptions}
      />
      <Input
        label="Next Pay Date"
        type="date"
        value={form.nextPayDate}
        onChange={e => setForm(f => ({ ...f, nextPayDate: e.target.value }))}
      />
      {accountOptions.length > 0 && (
        <Select
          label="Deposit Account"
          value={form.accountId}
          onValueChange={v => setForm(f => ({ ...f, accountId: v }))}
          options={accountOptions}
        />
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? 'Save Changes' : 'Add Paycheck'}</Button>
      </div>
    </form>
  );
}

export function Paychecks() {
  const { paychecks, allocations, accounts, recurringExpenses, addAllocation, deletePaycheck } =
    useFinanceStore();
  const [paycheckModal, setPaycheckModal] = useState(false);
  const [editingPaycheck, setEditingPaycheck] = useState<PaycheckSchedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const checkingBalance = useMemo(
    () => accounts.filter(a => a.type === 'checking').reduce((s, a) => s + a.balance, 0),
    [accounts]
  );

  const upcomingBills = useMemo(
    () => getUpcomingBills(recurringExpenses, 30),
    [recurringExpenses]
  );
  const upcomingBillsTotal = upcomingBills.reduce((s, b) => s + b.amount, 0);

  const primaryPaycheck = paychecks[0];
  const daysUntilNext = primaryPaycheck
    ? differenceInDays(parseISO(primaryPaycheck.nextPayDate), new Date())
    : 14;

  const safeDailySpend = getSafeDailySpend(
    checkingBalance,
    upcomingBillsTotal,
    Math.max(daysUntilNext, 1)
  );

  const openEdit = (p: PaycheckSchedule) => {
    setEditingPaycheck(p);
    setPaycheckModal(true);
  };
  const openAdd = () => {
    setEditingPaycheck(null);
    setPaycheckModal(true);
  };

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      {primaryPaycheck && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Safe Daily Spend</p>
            <p className={cn('text-3xl font-semibold tabular-nums', safeDailySpend > 0 ? 'text-positive' : 'text-negative')}>
              {formatCurrency(safeDailySpend)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">until next paycheck</p>
          </div>
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Next Paycheck</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrency(primaryPaycheck.amount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {format(parseISO(primaryPaycheck.nextPayDate), 'MMM d')} · in{' '}
              {Math.max(0, daysUntilNext)} days
            </p>
          </div>
          <div className="bg-surface border border-border rounded-lg shadow-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Bills Due (next 30 days)</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {formatCurrency(upcomingBillsTotal)}
              </p>
              {upcomingBillsTotal > checkingBalance * 0.6 && (
                <AlertTriangle size={16} className="text-warning" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {upcomingBills.length} bills upcoming
            </p>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Paycheck Schedules</h2>
          <Button size="sm" onClick={openAdd}>
            <Plus size={13} />
            Add Paycheck
          </Button>
        </div>
        {paychecks.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No paychecks yet"
            description="Add your paycheck schedule to see safe-to-spend, upcoming balance, and paycheck allocation."
            action={{ label: 'Add Paycheck', onClick: openAdd }}
          />
        ) : (
          <div className="divide-y divide-border">
            {paychecks.map(p => {
              const nextDate = parseISO(p.nextPayDate);
              const days = differenceInDays(nextDate, new Date());
              const paycheckAllocs = allocations.filter(a => a.paycheckId === p.id);
              const allocTotal = paycheckAllocs.reduce((s, a) => s + a.amount, 0);
              const unallocated = p.amount - allocTotal;

              return (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {p.frequency} · Next: {format(nextDate, 'MMM d')} ({days >= 0 ? `in ${days} days` : 'overdue'})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(p.amount)}</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded text-muted-foreground hover:text-negative hover:bg-red-50 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {paycheckAllocs.length > 0 && (
                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        {paycheckAllocs.map(a => (
                          <div
                            key={a.id}
                            className={cn('h-full', a.type === 'bills' ? 'bg-blue-400' : a.type === 'savings' ? 'bg-green-400' : a.type === 'investing' ? 'bg-purple-400' : a.type === 'debt' ? 'bg-red-400' : 'bg-amber-400')}
                            style={{ width: `${(a.amount / p.amount) * 100}%` }}
                            title={`${a.label}: ${formatCurrency(a.amount)}`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {paycheckAllocs.map(a => (
                          <span key={a.id} className={cn('px-2 py-0.5 rounded-full text-xs font-medium', allocColors[a.type])}>
                            {a.label} · {formatCurrency(a.amount)}
                          </span>
                        ))}
                        {unallocated > 0.01 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            Unallocated · {formatCurrency(unallocated)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {paycheckAllocs.length === 0 && (
                    <button
                      onClick={() => addAllocation({ id: generateId(), paycheckId: p.id, label: 'Bills', amount: 0, type: 'bills' })}
                      className="text-xs text-brand hover:underline"
                    >
                      + Allocate this paycheck
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={paycheckModal} onOpenChange={setPaycheckModal} title={editingPaycheck ? 'Edit Paycheck' : 'Add Paycheck'}>
        <PaycheckForm initial={editingPaycheck ?? undefined} onSuccess={() => setPaycheckModal(false)} onCancel={() => setPaycheckModal(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={open => !open && setDeleteConfirm(null)}
        title="Delete Paycheck"
        description="This will remove the paycheck schedule and its allocations."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteConfirm) {
            deletePaycheck(deleteConfirm);
            toast('Paycheck removed', 'info');
          }
          setDeleteConfirm(null);
        }}
      />
    </div>
  );
}
