import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/platformDetection';

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  haptic?: boolean;
}

export function TouchButton({ 
  children, 
  className, 
  onClick, 
  haptic = true,
  ...props 
}: TouchButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic) {
      triggerHaptic('light');
    }
    onClick?.(e);
  };

  return (
    <button
      className={cn(
        "min-h-touch min-w-touch rounded-lg transition-all duration-200",
        "active:scale-95 active:opacity-80",
        "touch-manipulation",
        "px-[clamp(0.75rem,3vw,1.5rem)] py-[clamp(0.5rem,2vh,1rem)]",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

interface TouchCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  haptic?: boolean;
}

export function TouchCard({ 
  children, 
  className, 
  onClick,
  haptic = true 
}: TouchCardProps) {
  const handleClick = () => {
    if (haptic) {
      triggerHaptic('light');
    }
    onClick?.();
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        "transition-all duration-200",
        "active:scale-[0.98] active:shadow-md",
        "touch-manipulation",
        "p-[clamp(1rem,3vw,1.5rem)]",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

interface TouchListItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  haptic?: boolean;
}

export function TouchListItem({ 
  children, 
  className,
  onClick,
  haptic = true 
}: TouchListItemProps) {
  const handleClick = () => {
    if (haptic) {
      triggerHaptic('light');
    }
    onClick?.();
  };

  return (
    <div
      className={cn(
        "flex items-center w-full",
        "min-h-touch px-[clamp(1rem,3vw,1.5rem)] py-[clamp(0.75rem,2vh,1rem)]",
        "rounded-lg transition-all duration-200",
        "active:bg-muted/50",
        "touch-manipulation",
        onClick && "cursor-pointer hover:bg-muted/30",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
