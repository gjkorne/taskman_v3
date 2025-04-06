import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { withDensity, WithDensityProps } from '../UI/hoc/withDensity';
import { densityClasses } from '../UI/DensityStyles';

interface FormGroupBaseProps extends WithDensityProps {
  label?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

/**
 * FormGroupBase component
 * Groups form elements with labels and error messages in a density-aware layout
 */
const FormGroupBase: React.FC<FormGroupBaseProps> = ({
  label,
  htmlFor,
  children,
  className = '',
  error,
  helpText,
  required = false,
  densityLevel,
  densitySpacing
}) => {
  // Compute appropriate spacing based on the current density level
  const labelClassName = cn(
    "block font-medium text-gray-700 mb-1",
    densityLevel === 'compact' ? 'text-sm' : densityLevel === 'comfortable' ? 'text-base' : 'text-sm'
  );
  
  const groupClassName = cn(
    densityClasses.container,
    "mb-4",
    className
  );
  
  const helpTextClassName = cn(
    "text-gray-500 mt-1",
    densityLevel === 'compact' ? 'text-xs' : densityLevel === 'comfortable' ? 'text-sm' : 'text-xs'
  );
  
  const errorClassName = cn(
    "text-red-500 mt-1",
    densityLevel === 'compact' ? 'text-xs' : densityLevel === 'comfortable' ? 'text-sm' : 'text-xs'
  );

  return (
    <div className={groupClassName} style={{ gap: densitySpacing.gap }}>
      {label && (
        <label 
          htmlFor={htmlFor} 
          className={labelClassName}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {children}
      
      {helpText && !error && (
        <p className={helpTextClassName}>{helpText}</p>
      )}
      
      {error && (
        <p className={errorClassName}>{error}</p>
      )}
    </div>
  );
};

/**
 * FormGroup component with density awareness
 * Used to group form controls with labels and error messages
 */
export const FormGroup = withDensity(FormGroupBase);

export default FormGroup;
