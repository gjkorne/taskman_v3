import React from 'react';
import { useDensity, DensityLevel } from '../../../contexts/ui/DensityContext';
import { getDensitySpacing, DensitySpacing } from '../DensityStyles';

/**
 * Props passed to components wrapped with the withDensity HOC
 */
export interface WithDensityProps {
  densityLevel: DensityLevel;
  densitySpacing: DensitySpacing;
  toggleDensity: () => void;
  setDensity: (density: DensityLevel) => void;
}

/**
 * Higher-order component that provides density awareness to wrapped components
 * 
 * This HOC follows the pattern mentioned in the refactoring plan to "Use render props 
 * or higher-order components for shared behaviors"
 * 
 * @param WrappedComponent The component to wrap with density functionality
 * @returns A new component with density props injected
 */
export function withDensity<P>(
  WrappedComponent: React.ComponentType<P & WithDensityProps>
): React.FC<Omit<P, keyof WithDensityProps>> {
  const ComponentWithDensity = (props: Omit<P, keyof WithDensityProps>) => {
    const { density, setDensity, toggleDensity } = useDensity();
    const densitySpacing = getDensitySpacing(density);
    
    return (
      <WrappedComponent
        {...(props as P)}
        densityLevel={density}
        densitySpacing={densitySpacing}
        toggleDensity={toggleDensity}
        setDensity={setDensity}
      />
    );
  };
  
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithDensity.displayName = `withDensity(${displayName})`;
  
  return ComponentWithDensity;
}
