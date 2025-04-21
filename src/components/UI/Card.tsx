import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type CardVariants = 'default' | 'outlined' | 'elevated';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariants;
  className?: string;
}

export const Card = ({ children, variant = 'default', className, ...props }: CardProps) => {
  const baseClasses = 'bg-white rounded-lg p-4';
  const variantClasses: Record<CardVariants, string> = {
    default: 'shadow-sm',
    outlined: 'border border-gray-200',
    elevated: 'shadow-lg',
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {children}
    </div>
  );
};
