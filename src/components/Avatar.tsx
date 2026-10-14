interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  // Generate consistent color based on name
  const colors = [
    'bg-brand-100 text-brand-700',
    'bg-accent-100 text-accent-700',
    'bg-info-bg text-info',
    'bg-success-bg text-success',
    'bg-warning-bg text-warning',
  ];

  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  return (
    <div
      className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center font-semibold ${className}`}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
