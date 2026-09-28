interface ProgressBarProps {
  progress: number; // 0-100
  color?: 'brand' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ 
  progress, 
  color = 'brand', 
  size = 'md',
  showLabel = false,
  label 
}: ProgressBarProps) {
  const colors = {
    brand: 'bg-brand-500',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-text-secondary">{label}</span>
          <span className="text-xs font-semibold text-text-primary tabular-nums">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-surface-sunken rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  );
}
