import { cn } from '../../lib/utils/cn';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs font-medium text-foreground">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm border rounded-md bg-surface text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-1 focus:ring-brand transition-shadow',
            error ? 'border-negative focus:ring-negative' : 'border-border',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-negative">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
