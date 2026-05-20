import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, ToastType } from '../../lib/utils/toast';
import { cn } from '../../lib/utils/cn';

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles: Record<ToastType, string> = {
  success: 'border-green-200 bg-white text-foreground',
  error: 'border-red-200 bg-white text-foreground',
  info: 'border-border bg-white text-foreground',
  warning: 'border-amber-200 bg-white text-foreground',
};

const iconStyles: Record<ToastType, string> = {
  success: 'text-positive',
  error: 'text-negative',
  info: 'text-brand',
  warning: 'text-warning',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
      {toasts.map(t => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-card-hover text-sm font-medium animate-slide-in',
              'min-w-[240px] max-w-[360px]',
              styles[t.type]
            )}
          >
            <Icon size={15} className={cn('flex-shrink-0', iconStyles[t.type])} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
