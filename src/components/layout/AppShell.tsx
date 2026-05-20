import { useEffect, useCallback, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn } from '../../lib/utils/cn';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Your financial overview' },
  '/budget': { title: 'Budget', subtitle: 'Track spending by category' },
  '/transactions': { title: 'Transactions', subtitle: 'All income and expenses' },
  '/goals': { title: 'Goals', subtitle: 'Track your financial milestones' },
  '/bills': { title: 'Bills', subtitle: 'Recurring expenses & subscriptions' },
  '/paychecks': { title: 'Paychecks', subtitle: 'Income schedule & allocation' },
  '/cashflow': { title: 'Cashflow Forecast', subtitle: 'Projected balance over 90 days' },
  '/projections': { title: 'Projections', subtitle: 'Long-term financial trajectory' },
  '/monte-carlo': { title: 'Monte Carlo', subtitle: 'Probability-based outcome simulation' },
  '/taxes': { title: 'Tax Calculator', subtitle: 'Estimate your tax liability' },
  '/scenarios': { title: 'Scenarios', subtitle: 'Compare financial futures' },
  '/import': { title: 'Import / Export', subtitle: 'Manage your data' },
  '/settings': { title: 'Settings', subtitle: 'Configure your preferences' },
};

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { transactions, goals, recurringExpenses } = useFinanceStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const results = query.trim().length < 2 ? [] : [
    ...transactions
      .filter(t => t.description.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 4)
      .map(t => ({ label: t.description, sub: `${t.date} · ${t.type}`, href: '/transactions' })),
    ...goals
      .filter(g => g.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map(g => ({ label: g.name, sub: 'Goal', href: '/goals' })),
    ...recurringExpenses
      .filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map(r => ({ label: r.name, sub: `Bill · ${r.recurrence}`, href: '/bills' })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search transactions, goals, bills..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
            className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={onClose}><X size={14} className="text-muted-foreground hover:text-foreground" /></button>
        </div>
        {results.length > 0 && (
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left transition-colors"
                onClick={() => { navigate(r.href); onClose(); }}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {query.trim().length >= 2 && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No results found</div>
        )}
        {query.trim().length === 0 && (
          <div className="px-4 py-3 text-xs text-muted-foreground">Type to search across transactions, goals and bills</div>
        )}
      </div>
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = pageTitles[location.pathname] ?? { title: 'Flint', subtitle: '' };
  const { captureNetWorthSnapshot } = useFinanceStore();
  const { toggleSidebar } = useSettingsStore();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    captureNetWorthSnapshot();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key === 'k') { e.preventDefault(); setSearchOpen(s => !s); }
    if (meta && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
    if (meta && e.key === 'n' && !searchOpen) {
      e.preventDefault();
      if (location.pathname === '/transactions' || location.pathname === '/') {
        navigate('/transactions?new=1');
      }
    }
    if (e.key === 'Escape') setSearchOpen(false);
  }, [toggleSidebar, searchOpen, location.pathname, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar onSearchOpen={() => setSearchOpen(true)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar title={page.title} subtitle={page.subtitle} onSearchOpen={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
