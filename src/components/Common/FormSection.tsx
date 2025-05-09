import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface FormSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  useGradient?: boolean;
  hideTitle?: boolean;
}

/**
 * FormSection component
 * Provides consistent styling for form sections across the application
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  className = '',
  useGradient = true,
  hideTitle = false,
}) => {
  return (
    <div
      className={cn(
        'space-y-6 p-6 bg-gray-200 rounded-lg shadow-sm',
        className
      )}
    >
      {!hideTitle && title && (
        <h2
          className={cn(
            'text-lg font-semibold',
            useGradient
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text'
              : 'text-gray-800'
          )}
        >
          {title}
        </h2>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default FormSection;
