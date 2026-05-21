import { cn } from '../../lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none',
        variant === 'default' && 'bg-brand text-white hover:bg-brand-deep',
        variant === 'secondary' && 'bg-accent text-foreground hover:bg-accent/80 border border-border',
        variant === 'ghost' && 'text-muted-foreground hover:text-foreground hover:bg-accent',
        variant === 'destructive' && 'bg-negative text-white hover:bg-negative/90',
        size === 'sm' && 'h-7 px-3 text-xs',
        size === 'md' && 'h-8 px-4 text-sm',
        size === 'lg' && 'h-10 px-5 text-sm',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
}
