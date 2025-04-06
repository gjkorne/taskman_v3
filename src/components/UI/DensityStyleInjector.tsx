import React, { useEffect } from 'react';
import { useDensity } from '../../contexts/ui/DensityContext';
import { generateDensityCss } from './DensityStyles';
import './DensityStyles.css';

/**
 * A component that injects density CSS styles into the document head
 * This allows global styling based on the current density setting
 */
export const DensityStyleInjector: React.FC = () => {
  const { density } = useDensity();
  
  useEffect(() => {
    // Create a style element for dynamic density styles
    const styleElement = document.createElement('style');
    styleElement.id = 'density-dynamic-styles';
    styleElement.innerHTML = generateDensityCss();
    
    // Add the dynamic styles to the document head
    document.head.appendChild(styleElement);
    
    // Add a data-density attribute to the body for global styling
    document.body.setAttribute('data-density', density);
    
    // Clean up when component unmounts
    return () => {
      const existingStyle = document.getElementById('density-dynamic-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
      document.body.removeAttribute('data-density');
    };
  }, []);
  
  // Update body attribute when density changes
  useEffect(() => {
    document.body.setAttribute('data-density', density);
  }, [density]);
  
  // This component doesn't render anything visible
  return null;
};
