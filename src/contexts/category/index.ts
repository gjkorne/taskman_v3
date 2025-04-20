import { useContext } from 'react';
import { useCategoryData } from './CategoryDataContext';
import { useCategoryUI } from './CategoryUIContext';
import {
  CategoryProvider,
  CategoryContext,
  type CategoryContextType,
} from './CategoryProvider';

// Legacy hook that combines both contexts for backward compatibility
export function useCategories(): CategoryContextType {
  const context = useContext(CategoryContext);

  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }

  return context;
}

// Named exports for the new pattern
export { CategoryProvider, useCategoryData, useCategoryUI, CategoryContext };

// Re-export types
export type { CategoryContextType };

// Export default for easier importing
export default CategoryProvider;
