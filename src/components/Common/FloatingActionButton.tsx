import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
  color?: 'primary' | 'secondary' | 'success' | 'danger';
  className?: string;
  title?: string;
}

/**
 * A reusable floating action button component
 * Provides consistent styling and positioning for action buttons
 */
export function FloatingActionButton({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  label = 'New Task',
  position = 'bottom-right',
  color = 'primary',
  className,
  title
}: FloatingActionButtonProps) {
  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'top-right': 'top-8 right-8',
    'top-left': 'top-8 left-8'
  };

  // Color classes
  const colorClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed w-14 h-14 rounded-full shadow-xl flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150',
        'z-50 group hover:scale-110 touch-manipulation',
        position === 'custom' ? '' : positionClasses[position],
        colorClasses[color],
        className
      )}
      aria-label={label}
      title={title || label}
    >
      {icon}
      {/* Optional tooltip - only shown on desktop */}
      {label && (
        <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none hidden lg:block">
          {label}
        </span>
      )}
    </button>
  );
}
