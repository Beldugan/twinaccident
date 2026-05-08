import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  titleRight?: ReactNode;
}

export function Card({ children, className = '', title, titleRight }: CardProps) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">{title}</h3>
          {titleRight}
        </div>
      )}
      {children}
    </div>
  );
}
