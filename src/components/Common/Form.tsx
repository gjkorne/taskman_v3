import React, { FormHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { withDensity, WithDensityProps } from '../UI/hoc/withDensity';
import { densityClasses } from '../UI/DensityStyles';

interface FormBaseProps extends WithDensityProps, Omit<FormHTMLAttributes<HTMLFormElement>, 'className'> {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  noValidate?: boolean;
}

/**
 * Form component base
 * A density-aware form container 
 */
const FormBase: React.FC<FormBaseProps> = ({
  children,
  className = '',
  fullWidth = false,
  noValidate = true,
  densityLevel,
  densitySpacing,
  ...formProps
}) => {
  const formClassName = cn(
    densityClasses.container,
    "bg-white rounded-lg",
    fullWidth ? 'w-full' : 'max-w-5xl mx-auto',
    className
  );

  // Adjust spacing based on density level
  const spacingStyle = {
    gap: densitySpacing.gap,
    padding: densityLevel === 'compact' ? '12px' : 
             densityLevel === 'comfortable' ? '24px' : '16px'
  };

  return (
    <form 
      className={formClassName}
      style={spacingStyle}
      noValidate={noValidate}
      {...Object.fromEntries(Object.entries(formProps).filter(([key]) => !key.startsWith('density')))}
    >
      {children}
    </form>
  );
};

/**
 * Form component with density awareness
 * Provides consistent styling and spacing for forms
 */
export const Form = withDensity(FormBase);

export default Form;
