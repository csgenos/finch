import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Account, AccountType } from '../../types/finance';
import { generateId } from '../../lib/storage/localStore';
import { parseMoney } from '../../lib/utils/numbers';

interface AccountFormProps {
  initial?: Partial<Account>;
  onSuccess: () => void;
  onCancel: () => void;
}

const accountTypeOptions: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investment / Brokerage' },
  { value: 'retirement', label: 'Retirement (401k/IRA)' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'loan', label: 'Loan / Debt' },
];

interface FormState {
  name: string;
  institution: string;
  type: AccountType;
  balance: string;
}

export function AccountForm({ initial, onSuccess, onCancel }: AccountFormProps) {
  const { addAccount, updateAccount } = useFinanceStore();
  const currency = useSettingsStore((state) => state.currency);
  const isEditing = !!initial?.id;

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    institution: initial?.institution ?? '',
    type: initial?.type ?? 'checking',
    balance: initial?.balance?.toString() ?? '0',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (parseMoney(form.balance) === null) errs.balance = 'Enter a valid number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const account: Account = {
      id: initial?.id ?? generateId(),
      name: form.name.trim(),
      institution: form.institution.trim() || undefined,
      type: form.type,
      balance: parseMoney(form.balance)!,
      currency: initial?.currency ?? currency,
      lastUpdated: new Date().toISOString(),
    };
    if (isEditing) updateAccount(account.id, account);
    else addAccount(account);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Account Name" placeholder="e.g. Chase Checking" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} />
      <Input label="Institution (optional)" placeholder="e.g. Chase Bank" value={form.institution} onChange={e => set('institution', e.target.value)} />
      <Select
        label="Account Type"
        value={form.type}
        onValueChange={v => set('type', v)}
        options={accountTypeOptions}
      />
      <Input
        label="Current Balance"
        type="number"
        step="0.01"
        placeholder="0.00"
        hint="Use negative values for credit cards and loans"
        value={form.balance}
        onChange={e => set('balance', e.target.value)}
        error={errors.balance}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEditing ? 'Save Changes' : 'Add Account'}</Button>
      </div>
    </form>
  );
}
