import type { ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

/** Radix Select cannot use ""; this value means "let the server pick the default model". */
export const WRITING_MODEL_SERVER_DEFAULT = '__flux_server_default__';

const triggerLikeNativeSelect = cn(
  'h-auto min-h-[2.75rem] w-full rounded-xl border px-3 py-2.5 text-sm font-medium shadow-sm backdrop-blur-sm',
  'border-border/70 bg-background/55 text-foreground',
  'dark:border-white/10 dark:bg-background/25',
  'focus:ring-2 focus:ring-primary/20 focus:ring-offset-0',
  'data-[placeholder]:text-muted-foreground [&>span]:line-clamp-1',
);

interface ModelSelectProps {
  label: string;
  leadingIcon?: ReactNode;
  /** Empty string = server default */
  value: string;
  onChange: (value: string) => void;
  /** Model tags from the API (plus any persisted tag not in the list). */
  models: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ModelSelect({
  label,
  leadingIcon,
  value,
  onChange,
  models,
  placeholder = 'Server default',
  className,
  disabled,
}: ModelSelectProps) {
  const selectValue = value.trim() === '' ? WRITING_MODEL_SERVER_DEFAULT : value;

  const handleChange = (v: string) => {
    onChange(v === WRITING_MODEL_SERVER_DEFAULT ? '' : v);
  };

  const options = models.map((name) => ({ label: name, value: name }));

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {leadingIcon ? <span className="shrink-0 text-primary/80">{leadingIcon}</span> : null}
        <span>{label}</span>
      </div>
      <Select value={selectValue} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className={triggerLikeNativeSelect}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[min(280px,var(--radix-select-content-available-height))]">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
