import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FluidGridProps {
  children: ReactNode;
  minCardWidth?: string;
  gap?: string;
  className?: string;
}

export function FluidGrid({ 
  children, 
  minCardWidth = '280px', 
  gap = 'clamp(1rem, 2vw, 1.5rem)',
  className 
}: FluidGridProps) {
  return (
    <div 
      className={cn("grid w-full", className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minCardWidth}, 100%), 1fr))`,
        gap: gap,
      }}
    >
      {children}
    </div>
  );
}
