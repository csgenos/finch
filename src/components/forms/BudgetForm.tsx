import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Budget } from '../../types/finance';
import { generateId } from '../../lib/storage/localStore';

interface BudgetFormProps {
  initial?: Partial<Budget>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({ initial, onSuccess, onCancel }: BudgetFormProps) {
  const { categories, addBudget, updateBudget } = useFinanceStore();
  const isEditing = !!initial?.id;
  const now = new Date();

  const [form, setForm] = useState({
    categoryId: initial?.categoryId ?? '',
    amount: initial?.amount?.toString() ?? '',
    period: (initial?.period ?? 'monthly') as 'monthly' | 'yearly',
    year: (initial?.year ?? now.getFullYear()).toString(),
    month: (initial?.month ?? now.getMonth() + 1).toString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const expenseCategories = categories
    .filter(c => c.type === 'expense')
    .map(c => ({ value: c.id, label: c.name }));

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2024, i, 1).toLocaleString('en-US', { month: 'long' }),
  }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.categoryId) errs.categoryId = 'Select a category';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a positive amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const budget: Budget = {
      id: initial?.id ?? generateId(),
      categoryId: form.categoryId,
      amount: parseFloat(form.amount),
      period: form.period,
      year: parseInt(form.year),
      month: form.period === 'monthly' ? parseInt(form.month) : undefined,
    };
    if (isEditing) updateBudget(budget.id, budget);
    else addBudget(budget);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="Category" value={form.categoryId} onValueChange={v => set('categoryId', v)} options={expenseCategories} placeholder="Select category" error={errors.categoryId} />
      <Input label="Budget Amount" type="number" min="0" step="1" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} error={errors.amount} />
      <div className="flex bg-muted rounded-md p-0.5 gap-0.5">
        {(['monthly', 'yearly'] as const).map(p => (
          <button key={p} type="button" onClick={() => set('period', p)}
            className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors ${form.period === p ? 'bg-surface text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground'}`}>
            {p}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Year" type="number" value={form.year} onChange={e => set('year', e.target.value)} />
        {form.period === 'monthly' && (
          <Select label="Month" value={form.month} onValueChange={v => set('month', v)} options={monthOptions} />
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEditing ? 'Save Changes' : 'Add Budget'}</Button>
      </div>
    </form>
  );
}
