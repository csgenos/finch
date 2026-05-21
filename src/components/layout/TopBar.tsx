import { Search } from 'lucide-react';
import { formatFullDate } from '../../lib/utils/dates';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onSearchOpen?: () => void;
}

export function TopBar({ title, subtitle, onSearchOpen }: TopBarProps) {
  const today = formatFullDate(new Date());

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-surface border-b border-border">
      <div>
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:block">{today}</span>
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Search (Ctrl+K)"
        >
          <Search size={13} />
          <span className="text-xs hidden sm:block">Search</span>
          <kbd className="hidden rounded bg-muted px-1 text-xs sm:block">Ctrl+K</kbd>
        </button>
      </div>
    </header>
  );
}
