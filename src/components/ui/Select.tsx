import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
}

const EMPTY_OPTION_PREFIX = '__empty_option__';

export function Select({ value, onValueChange, options, placeholder = 'Select...', label, error }: SelectProps) {
  const normalized = options.map((opt, index) => ({
    originalValue: opt.value,
    value: opt.value === '' ? `${EMPTY_OPTION_PREFIX}${index}` : opt.value,
    label: opt.label,
  }));
  const emptyOption = normalized.find(opt => opt.originalValue === '');
  const normalizedValue = value === '' && emptyOption ? emptyOption.value : value;

  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-foreground">{label}</label>}
      <RadixSelect.Root
        value={normalizedValue}
        onValueChange={(next) => {
          const option = normalized.find(opt => opt.value === next);
          onValueChange(option?.originalValue ?? next);
        }}
      >
        <RadixSelect.Trigger
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-surface text-foreground',
            'focus:outline-none focus:ring-1 focus:ring-brand transition-shadow',
            error ? 'border-negative' : 'border-border',
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon><ChevronDown size={13} className="text-muted-foreground" /></RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 bg-surface border border-border rounded-lg shadow-card-hover overflow-hidden animate-slide-in"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {normalized.map(opt => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className="flex items-center justify-between px-3 py-2 text-sm rounded-md text-foreground cursor-pointer hover:bg-accent focus:bg-accent outline-none"
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator><Check size={12} /></RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
