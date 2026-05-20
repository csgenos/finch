import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Your financial overview' },
  '/budget': { title: 'Budget', subtitle: 'Track spending by category' },
  '/transactions': { title: 'Transactions', subtitle: 'All income and expenses' },
  '/projections': { title: 'Projections', subtitle: 'Long-term financial trajectory' },
  '/monte-carlo': { title: 'Monte Carlo', subtitle: 'Probability-based outcome simulation' },
  '/taxes': { title: 'Tax Calculator', subtitle: 'Estimate your tax liability' },
  '/scenarios': { title: 'Scenarios', subtitle: 'Compare financial futures' },
  '/settings': { title: 'Settings', subtitle: 'Configure your preferences' },
};

export function AppShell() {
  const location = useLocation();
  const page = pageTitles[location.pathname] ?? { title: 'Flint', subtitle: '' };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar title={page.title} subtitle={page.subtitle} />
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
