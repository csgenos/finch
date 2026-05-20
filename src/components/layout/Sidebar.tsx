import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  Shuffle,
  Calculator,
  GitBranch,
  Settings,
  ChevronLeft,
  ChevronRight,
  Target,
  RotateCcw,
  DollarSign,
  TrendingDown,
  Upload,
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn } from '../../lib/utils/cn';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/budget', icon: Wallet, label: 'Budget' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/bills', icon: RotateCcw, label: 'Bills' },
  { to: '/paychecks', icon: DollarSign, label: 'Paychecks' },
  { to: '/cashflow', icon: TrendingDown, label: 'Cashflow' },
  { to: '/projections', icon: TrendingUp, label: 'Projections' },
  { to: '/monte-carlo', icon: Shuffle, label: 'Monte Carlo' },
  { to: '/taxes', icon: Calculator, label: 'Taxes' },
  { to: '/scenarios', icon: GitBranch, label: 'Scenarios' },
  { to: '/import', icon: Upload, label: 'Import/Export' },
];

interface SidebarProps {
  onSearchOpen?: () => void;
}

export function Sidebar({ onSearchOpen: _onSearchOpen }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore();

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-surface border-r border-border transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className={cn(
        'flex items-center h-14 px-4 border-b border-border',
        sidebarCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">F</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight text-sm">Flint</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">F</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                'text-muted-foreground hover:text-foreground hover:bg-accent',
                isActive && 'text-foreground bg-accent',
                sidebarCollapsed && 'justify-center'
              )
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-3 space-y-0.5 border-t border-border pt-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-150',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              isActive && 'text-foreground bg-accent',
              sidebarCollapsed && 'justify-center'
            )
          }
        >
          <Settings size={16} strokeWidth={1.75} />
          {!sidebarCollapsed && <span>Settings</span>}
        </NavLink>

        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-150',
            'text-muted-foreground hover:text-foreground hover:bg-accent',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={16} strokeWidth={1.75} />
          ) : (
            <>
              <ChevronLeft size={16} strokeWidth={1.75} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
