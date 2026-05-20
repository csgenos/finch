import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onOpenChange, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'bg-surface border border-border rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
            'animate-slide-in focus:outline-none',
            size === 'sm' && 'w-full max-w-sm',
            size === 'md' && 'w-full max-w-md',
            size === 'lg' && 'w-full max-w-xl',
          )}
        >
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border">
            <div>
              <Dialog.Title className="text-sm font-semibold text-foreground">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-muted-foreground mt-0.5">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>
          <div className="px-5 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
