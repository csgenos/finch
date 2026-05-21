import { cn } from '../../lib/utils/cn';

interface FlintWordmarkProps {
  className?: string;
  imageClassName?: string;
}

export function FlintWordmark({ className, imageClassName }: FlintWordmarkProps) {
  return (
    <div className={cn('inline-flex items-center', className)}>
      <img
        src="/flint-wordmark.png"
        alt="Flint"
        className={cn('h-8 w-auto object-contain', imageClassName)}
      />
    </div>
  );
}

export function FlintMark({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface shadow-subtle',
        className
      )}
      aria-label="Flint"
    >
      <span className={cn('font-serif text-2xl leading-none text-foreground', textClassName)}>f</span>
    </div>
  );
}
