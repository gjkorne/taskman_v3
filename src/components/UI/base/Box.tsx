import React from 'react';
import { useDensity } from '../../../contexts/ui/DensityContext';
import { densityClasses } from '../DensityStyles';

/**
 * Props for the Box component
 */
export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  densityClass?: keyof typeof densityClasses;
}

/**
 * A basic container component that adapts to density settings
 * Can be rendered as different HTML elements using the "as" prop
 */
export const Box: React.FC<BoxProps> = ({
  children,
  className = '',
  as: Component = 'div',
  densityClass = 'container',
  ...rest
}) => {
  const { density } = useDensity();
  
  const densityClassName = densityClasses[densityClass] || densityClasses.container;
  const combinedClassName = `${densityClassName} ${className}`.trim();
  
  return (
    <Component className={combinedClassName} data-density={density} {...rest}>
      {children}
    </Component>
  );
};
