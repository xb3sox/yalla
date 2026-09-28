import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  onRemove?: () => void;
  removable?: boolean;
}

export function FilterChip({ label, active = false, onClick, onRemove, removable = false }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-brand-500 text-white shadow-sm'
          : 'bg-surface-raised text-text-secondary border border-border hover:border-brand-300 hover:text-brand-600'
      }`}
      aria-pressed={active}
    >
      <span>{label}</span>
      {removable && active && onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Remove filter"
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}

interface FilterChipsProps {
  filters: { id: string; label: string; active: boolean }[];
  onToggle: (id: string) => void;
  onClearAll?: () => void;
}

export function FilterChips({ filters, onToggle, onClearAll }: FilterChipsProps) {
  const activeCount = filters.filter(f => f.active).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map(filter => (
        <FilterChip
          key={filter.id}
          label={filter.label}
          active={filter.active}
          onClick={() => onToggle(filter.id)}
        />
      ))}
      {activeCount > 0 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
