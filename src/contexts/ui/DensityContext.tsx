import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Available density options for UI components
 */
export enum DensityLevel {
  COMPACT = 'compact',
  NORMAL = 'normal',
  COMFORTABLE = 'comfortable'
}

/**
 * Type definitions for the Density Context
 */
interface DensityContextType {
  density: DensityLevel;
  setDensity: (density: DensityLevel) => void;
  toggleDensity: () => void;
}

/**
 * Default context values
 */
const defaultContext: DensityContextType = {
  density: DensityLevel.NORMAL,
  setDensity: () => {},
  toggleDensity: () => {}
};

/**
 * Context for managing UI density throughout the application
 */
export const DensityContext = createContext<DensityContextType>(defaultContext);

/**
 * Hook for accessing density context
 */
export const useDensity = () => useContext(DensityContext);

/**
 * Storage key for persisting density preference
 */
const STORAGE_KEY = 'taskman_density_preference';

/**
 * Provider component for Density Context
 */
export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [density, setDensityState] = useState<DensityLevel>(() => {
    const savedDensity = localStorage.getItem(STORAGE_KEY);
    return savedDensity ? (savedDensity as DensityLevel) : DensityLevel.NORMAL;
  });

  // Update localStorage when density changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, density);
    
    // Apply global CSS class for styling based on density
    document.body.classList.remove(
      `density-${DensityLevel.COMPACT}`,
      `density-${DensityLevel.NORMAL}`,
      `density-${DensityLevel.COMFORTABLE}`
    );
    document.body.classList.add(`density-${density}`);
  }, [density]);

  /**
   * Set density level
   */
  const setDensity = (newDensity: DensityLevel) => {
    setDensityState(newDensity);
  };

  /**
   * Toggle through density levels
   */
  const toggleDensity = () => {
    setDensityState(current => {
      switch (current) {
        case DensityLevel.COMPACT:
          return DensityLevel.NORMAL;
        case DensityLevel.NORMAL:
          return DensityLevel.COMFORTABLE;
        case DensityLevel.COMFORTABLE:
          return DensityLevel.COMPACT;
        default:
          return DensityLevel.NORMAL;
      }
    });
  };

  return (
    <DensityContext.Provider value={{ density, setDensity, toggleDensity }}>
      {children}
    </DensityContext.Provider>
  );
};
