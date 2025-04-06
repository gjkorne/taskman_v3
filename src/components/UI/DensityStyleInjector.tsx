import React, { useEffect } from 'react';
import { densityCssModule } from './DensityStyles';

/**
 * Component that injects density CSS styles into the document head
 * This should be included once at the app root
 */
export const DensityStyleInjector: React.FC = () => {
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = 'density-styles';
    styleElement.textContent = densityCssModule;
    
    // Inject into head
    document.head.appendChild(styleElement);
    
    // Cleanup on unmount
    return () => {
      const existingStyle = document.getElementById('density-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  
  return null;
};
