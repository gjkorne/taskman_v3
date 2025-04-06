import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { withDensity, WithDensityProps } from '../UI/hoc/withDensity';
import { densityClasses } from '../UI/DensityStyles';

interface FormSectionProps extends WithDensityProps {
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
const FormSectionBase: React.FC<FormSectionProps> = ({
  title,
  children,
  className = '',
  useGradient = true,
  hideTitle = false,
  densityLevel,
  // Applied via style to container
  densitySpacing
}) => {
  // Adjust spacing based on density level
  const sectionClassName = cn(
    densityClasses.container,
    "bg-gray-200 rounded-lg shadow-sm",
    densityLevel === 'compact' ? 'space-y-4 p-4' : 
    densityLevel === 'comfortable' ? 'space-y-8 p-8' : 
    'space-y-6 p-6',
    className
  );

  const titleClassName = cn(
    densityClasses.heading,
    "font-semibold",
    densityLevel === 'compact' ? 'text-base' : 
    densityLevel === 'comfortable' ? 'text-xl' : 
    'text-lg',
    useGradient 
      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text"
      : "text-gray-800"
  );
  
  const contentClassName = cn(
    "space-y-4",
    densityLevel === 'compact' ? 'space-y-3' : 
    densityLevel === 'comfortable' ? 'space-y-5' : 
    'space-y-4'
  );

  return (
    <div className={sectionClassName} style={{ gap: densitySpacing.gap }}>
      {!hideTitle && title && (
        <h2 className={titleClassName}>
          {title}
        </h2>
      )}
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
};

/**
 * FormSection component with density awareness
 */
export const FormSection = withDensity(FormSectionBase);

export default FormSection;
