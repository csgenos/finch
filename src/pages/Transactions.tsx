import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Tag, CheckSquare, Square } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Transaction } from '../types/finance';
import { formatCurrency } from '../lib/utils/format';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { TransactionForm } from '../components/forms/TransactionForm';
import { cn } from '../lib/utils/cn';

export function Transactions() {
  const { transactions, categories, deleteTransaction, updateTransaction } = useFinanceStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState('');

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '-';

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    transactions.forEach(t => (t.tags ?? []).forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.notes ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || t.type === filter;
      const matchesTag = !tagFilter || (t.tags ?? []).includes(tagFilter);
      return matchesSearch && matchesFilter && matchesTag;
    });
  }, [transactions, search, filter, tagFilter]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (txn: Transaction) => { setEditing(txn); setModalOpen(true); };
  const handleDelete = (id: string) => {
    if (confirm('Delete this transaction?')) deleteTransaction(id);
  };

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  };

  const bulkDelete = () => {
    if (!confirm(`Delete ${selected.size} transactions?`)) return;
    selected.forEach(id => deleteTransaction(id));
    setSelected(new Set());
  };

  const bulkSetCategory = () => {
    if (!bulkCategoryId) return;
    selected.forEach(id => updateTransaction(id, { categoryId: bulkCategoryId }));
    setSelected(new Set());
    setBulkCategoryId('');
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="p-6 space-y-4 max-w-screen-lg mx-auto">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
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
              className={cn('px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors',
                filter === f ? 'bg-brand-soft text-brand shadow-subtle' : 'text-muted-foreground hover:text-foreground')}
            >
              {f}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag size={12} className="text-muted-foreground" />
            <select
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1.5 bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">All tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <Button size="sm" onClick={openAdd}><Plus size={13} />Add</Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-soft/70 border border-brand/30 rounded-lg">
          <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
          <div className="flex items-center gap-2 flex-1">
            <select
              value={bulkCategoryId}
              onChange={e => setBulkCategoryId(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1.5 bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Recategorize...</option>
              {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {bulkCategoryId && (
              <Button size="sm" variant="secondary" onClick={bulkSetCategory}>Apply</Button>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={bulkDelete}>
            <Trash2 size={12} />Delete selected
          </Button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-10 px-3 py-3">
                <button onClick={selectAll}>
                  {selected.size === filtered.length && filtered.length > 0
                    ? <CheckSquare size={14} className="text-brand" />
                    : <Square size={14} className="text-muted-foreground" />}
                </button>
              </th>
              <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Description</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="w-16 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(txn => (
              <tr key={txn.id} className={cn('hover:bg-muted/30 transition-colors group', selected.has(txn.id) && 'bg-brand-soft/60')}>
                <td className="px-3 py-3">
                  <button onClick={() => toggleSelect(txn.id)}>
                    {selected.has(txn.id)
                      ? <CheckSquare size={14} className="text-brand" />
                      : <Square size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm font-medium text-foreground">{txn.description}</p>
                  {txn.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{txn.notes}</p>}
                  {txn.tags && txn.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {txn.tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                          className={cn(
                            'px-1.5 py-0.5 rounded text-xs font-medium transition-colors',
                            tagFilter === tag ? 'bg-brand text-white' : 'bg-brand-soft text-brand hover:bg-brand-soft/80'
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground">{getCategoryName(txn.categoryId)}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">{txn.date}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={cn('text-sm font-semibold tabular-nums', txn.type === 'income' ? 'text-positive' : 'text-foreground')}>
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
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

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Transaction' : 'New Transaction'}>
        <TransactionForm
          initial={editing ?? undefined}
          onSuccess={() => { setModalOpen(false); setSelected(new Set()); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
