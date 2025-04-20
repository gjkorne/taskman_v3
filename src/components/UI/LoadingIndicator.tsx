import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type LoadingIndicatorSize = 'xs' | 'sm' | 'md' | 'lg';
type LoadingIndicatorVariant = 'default' | 'primary' | 'secondary' | 'ghost';

interface LoadingIndicatorProps {
  size?: LoadingIndicatorSize;
  variant?: LoadingIndicatorVariant;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingIndicator({
  size = 'md',
  variant = 'default',
  text,
  className,
  fullScreen = false,
}: LoadingIndicatorProps) {
  // Size map
  const sizeMap: Record<LoadingIndicatorSize, number> = {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
  };

  // Variant styling
  const variantClasses: Record<LoadingIndicatorVariant, string> = {
    default: 'text-gray-500',
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    ghost: 'text-gray-400',
  };

  // Full screen styling
  const fullScreenClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50'
    : '';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        fullScreenClasses,
        className
      )}
    >
      <Loader2
        className={cn('animate-spin', variantClasses[variant])}
        size={sizeMap[size]}
      />
      {text && (
        <p className={cn('mt-2 text-sm', variantClasses[variant])}>{text}</p>
      )}
    </div>
  );
}
