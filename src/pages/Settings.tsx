import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Account } from '../types/finance';
import { formatCurrency } from '../lib/utils/format';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { AccountForm } from '../components/forms/AccountForm';
import { cn } from '../lib/utils/cn';

export function Settings() {
  const { currency, setCurrency } = useSettingsStore();
  const { accounts, deleteAccount } = useFinanceStore();
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const openAdd = () => { setEditingAccount(null); setAccountModalOpen(true); };
  const openEdit = (account: Account) => { setEditingAccount(account); setAccountModalOpen(true); };
  const handleDelete = (id: string) => {
    if (confirm('Delete this account? All associated transactions will remain.')) deleteAccount(id);
  };

  return (
    <div className="p-6 space-y-5 max-w-screen-md mx-auto">
      {/* Accounts */}
      <div className="bg-surface border border-border rounded-lg shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Accounts</h2>
          <Button size="sm" onClick={openAdd}><Plus size={13} />Add Account</Button>
        </div>
        <div className="divide-y divide-border">
          {accounts.map(account => (
            <div key={account.id} className="flex items-center justify-between px-5 py-3 group">
              <div>
                <p className="text-sm font-medium text-foreground">{account.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{account.type}{account.institution ? ` · ${account.institution}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('text-sm font-semibold tabular-nums', account.balance < 0 ? 'text-negative' : 'text-foreground')}>
                  {account.balance < 0 ? '−' : ''}{formatCurrency(Math.abs(account.balance))}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(account)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(account.id)} className="p-1.5 rounded text-muted-foreground hover:text-negative hover:bg-red-50 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-surface border border-border rounded-lg shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Preferences</h2>
        </div>
        <div className="px-5 py-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-foreground">Display Currency</p>
            <p className="text-xs text-muted-foreground">Used for formatting all amounts</p>
          </div>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
        </div>
      </div>

      {/* About */}
      <div className="bg-surface border border-border rounded-lg shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">About Finch</h2>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-sm text-foreground font-medium">Version 0.2.0</p>
          <p className="text-xs text-muted-foreground">Built with Tauri · React · TypeScript · Local-first storage</p>
        </div>
      </div>

      <Modal open={accountModalOpen} onOpenChange={setAccountModalOpen} title={editingAccount ? 'Edit Account' : 'New Account'}>
        <AccountForm
          initial={editingAccount ?? undefined}
          onSuccess={() => setAccountModalOpen(false)}
          onCancel={() => setAccountModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
