import { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Transaction, TransactionType } from '../../types/finance';
import { generateId } from '../../lib/storage/localStore';
import { format } from 'date-fns';
import { cn } from '../../lib/utils/cn';

interface TransactionFormProps {
  initial?: Partial<Transaction>;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormState {
  description: string;
  amount: string;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  date: string;
  notes: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
  categoryId?: string;
  accountId?: string;
}

export function TransactionForm({ initial, onSuccess, onCancel }: TransactionFormProps) {
  const { accounts, categories, addTransaction, updateTransaction } = useFinanceStore();
  const isEditing = !!initial?.id;

  const [form, setForm] = useState<FormState>({
    description: initial?.description ?? '',
    amount: initial?.amount?.toString() ?? '',
    type: initial?.type ?? 'expense',
    categoryId: initial?.categoryId ?? '',
    accountId: initial?.accountId ?? accounts[0]?.id ?? '',
    date: initial?.date ?? format(new Date(), 'yyyy-MM-dd'),
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (tag && !tags.includes(tag)) setTags(ts => [...ts, tag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(ts => ts.filter(t => t !== tag));

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(ts => ts.slice(0, -1));
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.description.trim()) errs.description = 'Required';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a positive amount';
    if (!form.categoryId) errs.categoryId = 'Select a category';
    if (!form.accountId) errs.accountId = 'Select an account';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const txn: Transaction = {
      id: initial?.id ?? generateId(),
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      type: form.type,
      categoryId: form.categoryId,
      accountId: form.accountId,
      date: form.date,
      notes: form.notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (isEditing) updateTransaction(txn.id, txn);
    else addTransaction(txn);
    onSuccess();
  };

  const categoryOptions = categories
    .filter(c => c.type === form.type)
    .map(c => ({ value: c.id, label: c.name }));
  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex bg-muted rounded-md p-0.5 gap-0.5">
        {(['expense', 'income'] as TransactionType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { set('type', t); set('categoryId', ''); }}
            className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors ${form.type === t ? 'bg-surface text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <Input label="Description" placeholder="e.g. Whole Foods Market" value={form.description} onChange={e => set('description', e.target.value)} error={errors.description} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Amount" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} error={errors.amount} />
        <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
      </div>
      <Select label="Category" value={form.categoryId} onValueChange={v => set('categoryId', v)} options={categoryOptions} placeholder="Select category" error={errors.categoryId} />
      <Select label="Account" value={form.accountId} onValueChange={v => set('accountId', v)} options={accountOptions} placeholder="Select account" error={errors.accountId} />
      <Input label="Notes (optional)" placeholder="Any additional notes" value={form.notes} onChange={e => set('notes', e.target.value)} />

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tags (optional)</label>
        <div
          className={cn('flex flex-wrap gap-1.5 min-h-[36px] px-2.5 py-1.5 border border-border rounded-md bg-surface cursor-text', 'focus-within:ring-1 focus-within:ring-brand')}
          onClick={() => tagInputRef.current?.focus()}
        >
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand rounded text-xs font-medium">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-brand/60"><X size={10} /></button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
            placeholder={tags.length === 0 ? 'Type tag, press Enter or comma' : ''}
            className="flex-1 min-w-[120px] text-xs bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Press Enter or comma to add a tag</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEditing ? 'Save Changes' : 'Add Transaction'}</Button>
      </div>
    </form>
  );
}
