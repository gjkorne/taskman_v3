import { CATEGORIES } from '../types/categories';
import { useCategoryData } from './category';
import { useCategoryUI } from './category';

/**
 * Compatibility layer for the old useCategories hook
 * This allows components using the old API to continue working
 * while we transition to the new context structure
 */
export function useCategories() {
  // Get data and UI state from our new contexts
  const {
    categories,
    defaultCategories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getSubcategoriesForCategory,
    refreshCategories
  } = useCategoryData();
  
  // Access UI context but don't destructure since we don't use it directly
  // This ensures the component is wrapped in the provider
  useCategoryUI();
  
  /**
   * Set a category as the default
   * In the new architecture, this would update user preferences
   */
  const setDefaultCategory = async (): Promise<boolean> => {
    try {
      // This functionality would be moved to a user preferences service
      // For now, we'll just log that it was called
      console.warn('setDefaultCategory is deprecated and has no effect with the new context structure');
      return true;
    } catch (error) {
      console.error('Error setting default category:', error);
      return false;
    }
  };
  
  /**
   * Get built-in categories
   * This is a static function that returns the predefined categories
   */
  const getBuiltInCategories = () => CATEGORIES;
  
  // Combine all the functionality to match the old context API
  return {
    categories,
    defaultCategories,
    isLoading,
    error,
    createCategory,
    updateCategory, 
    deleteCategory,
    setDefaultCategory,
    getCategoryById,
    getSubcategoriesForCategory,
    refreshCategories,
    getBuiltInCategories
  };
}
