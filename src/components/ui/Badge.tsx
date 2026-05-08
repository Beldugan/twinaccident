interface BadgeProps {
  color: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ color, children, size = 'md' }: BadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {children}
    </span>
  );
}
