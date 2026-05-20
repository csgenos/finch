import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Transaction } from '../types/finance';
import { formatCurrency } from '../lib/utils/format';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { TransactionForm } from '../components/forms/TransactionForm';
import { cn } from '../lib/utils/cn';

export function Transactions() {
  const { transactions, categories, deleteTransaction } = useFinanceStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '—';

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || t.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (txn: Transaction) => { setEditing(txn); setModalOpen(true); };
  const handleDelete = (id: string) => {
    if (confirm('Delete this transaction?')) deleteTransaction(id);
  };

  return (
    <div className="p-6 space-y-4 max-w-screen-lg mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-border rounded-md bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex bg-muted rounded-md p-0.5">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors',
                filter === f ? 'bg-surface text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={13} />
          Add
        </Button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Description</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="w-16 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(txn => (
              <tr key={txn.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-foreground">{txn.description}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground">{getCategoryName(txn.categoryId)}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">{txn.date}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={cn(
                    'text-sm font-semibold tabular-nums',
                    txn.type === 'income' ? 'text-positive' : 'text-foreground'
                  )}>
                    {txn.type === 'income' ? '+' : '−'}{formatCurrency(txn.amount)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(txn)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(txn.id)} className="p-1.5 rounded text-muted-foreground hover:text-negative hover:bg-red-50 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No transactions found</p>
            <button onClick={openAdd} className="mt-2 text-xs text-brand hover:underline">Add your first transaction</button>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Transaction' : 'New Transaction'}
      >
        <TransactionForm
          initial={editing ?? undefined}
          onSuccess={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
