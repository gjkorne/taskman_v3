import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { categoryService } from '../../services/api/categoryService';
import { Category } from '../../services/interfaces/ICategoryService';
import { CATEGORIES } from '../../types/categories';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../lib/auth';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Define context type for category data
interface CategoryDataContextType {
  // Data
  categories: Category[];
  defaultCategories: Category[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  createCategory: (name: string, subcategories?: string[], color?: string, icon?: string, isDefault?: boolean) => Promise<Category | null>;
  updateCategory: (id: string, data: { name?: string; subcategories?: string[]; color?: string; icon?: string; isDefault?: boolean }) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  setDefaultCategory: (id: string) => Promise<boolean>;
  
  // Utility functions
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoriesForCategory: (categoryId: string) => string[];
  refreshCategories: () => Promise<void>;
  getBuiltInCategories: () => typeof CATEGORIES;
}

// Create data context
export const CategoryDataContext = createContext<CategoryDataContextType | undefined>(undefined);

// Data Provider component
export function CategoryDataProvider({ children }: { children: ReactNode }) {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get authentication state
  const { user, loading: authLoading } = useAuth();
  
  // Get toast notifications
  const { addToast } = useToast();

  // Fetch categories when user is authenticated
  useEffect(() => {
    // Don't attempt to fetch categories until authentication state is resolved
    if (authLoading) return;
    
    // If user is authenticated, fetch their categories
    if (user) {
      fetchCategories();
    } else {
      // If not authenticated, set default built-in categories
      // and mark as not loading
      setCategories([]);
      setDefaultCategories([]);
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Fetch all categories
  const fetchCategories = async () => {
    // Only proceed if user is authenticated
    if (!user) {
      setCategories([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await categoryService.getCategories();
      
      if (fetchError) throw fetchError;
      
      setCategories(data || []);
      
      // Also fetch default categories
      const { data: defaultCats, error: defaultError } = await categoryService.getDefaultCategories();
      
      if (defaultError) throw defaultError;
      
      setDefaultCategories(defaultCats || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load categories';
      
      if (isDevelopment) {
        console.error('Error fetching categories:', err);
      }
      
      setError(errorMessage);
      
      // Don't show authentication errors to the user as toast messages
      if (!err.message?.includes('must be logged in')) {
        addToast(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh categories (for when data changes)
  const refreshCategories = async () => {
    // Only refresh if user is authenticated
    if (user) {
      return fetchCategories();
    }
    return Promise.resolve();
  };
  
  // Create a new category
  const createCategory = async (
    name: string,
    subcategories?: string[],
    color?: string,
    icon?: string,
    isDefault?: boolean
  ): Promise<Category | null> => {
    // Check for authentication
    if (!user) {
      addToast('You must be logged in to create categories', 'error');
      return null;
    }
    
    try {
      const { data, error: createError } = await categoryService.createCategory({
        name,
        subcategories,
        color,
        icon,
        is_default: isDefault
      });
      
      if (createError) throw createError;
      
      // Update local state
      if (data) {
        setCategories(prev => [...prev, data]);
        
        // Update default categories if needed
        if (isDefault) {
          setDefaultCategories(prev => [...prev, data]);
        }
        
        addToast(`Category ${name} created successfully`, 'success');
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create category';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      return null;
    }
  };
  
  // Update an existing category
  const updateCategory = async (
    id: string,
    data: { name?: string; subcategories?: string[]; color?: string; icon?: string; isDefault?: boolean }
  ): Promise<Category | null> => {
    // Check for authentication
    if (!user) {
      addToast('You must be logged in to update categories', 'error');
      return null;
    }
    
    try {
      // Convert from client-side field names to server-side
      const serverData = {
        name: data.name,
        subcategories: data.subcategories,
        color: data.color,
        icon: data.icon,
        is_default: data.isDefault
      };
      
      const { data: updatedCategory, error: updateError } = await categoryService.updateCategory(id, serverData);
      
      if (updateError) throw updateError;
      
      if (updatedCategory) {
        // Update local state
        setCategories(prev => 
          prev.map(cat => cat.id === id ? updatedCategory : cat)
        );
        
        // Show success message
        addToast(`Category updated successfully`, 'success');
        
        return updatedCategory;
      }
      
      return null;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update category';
      
      if (isDevelopment) {
        console.error('Error updating category:', err);
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
      return null;
    }
  };
  
  // Delete a category
  const deleteCategory = async (id: string): Promise<boolean> => {
    // Check for authentication
    if (!user) {
      addToast('You must be logged in to delete categories', 'error');
      return false;
    }
    
    try {
      const { error: deleteError } = await categoryService.deleteCategory(id);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      // Show success message
      addToast('Category deleted successfully', 'success');
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete category';
      
      if (isDevelopment) {
        console.error('Error deleting category:', err);
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
      return false;
    }
  };
  
  // Set a category as default
  const setDefaultCategory = async (id: string): Promise<boolean> => {
    // Check for authentication
    if (!user) {
      addToast('You must be logged in to set default categories', 'error');
      return false;
    }
    
    try {
      const { error: updateError } = await categoryService.setDefaultCategory(id);
      
      if (updateError) throw updateError;
      
      // Reload categories to get updated defaults
      await fetchCategories();
      
      // Show success message
      addToast('Default category updated', 'success');
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to set default category';
      
      if (isDevelopment) {
        console.error('Error setting default category:', err);
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
      return false;
    }
  };
  
  // Get a category by ID
  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  };
  
  // Get subcategories for a category
  const getSubcategoriesForCategory = (categoryId: string): string[] => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.subcategories || [];
  };
  
  // Get built-in categories
  const getBuiltInCategories = () => CATEGORIES;
  
  // Memoize context value
  const contextValue = useMemo(() => ({
    // Data
    categories,
    defaultCategories,
    isLoading,
    error,
    
    // CRUD operations
    createCategory,
    updateCategory,
    deleteCategory,
    setDefaultCategory,
    
    // Utility functions
    getCategoryById,
    getSubcategoriesForCategory,
    refreshCategories,
    getBuiltInCategories
  }), [
    categories, 
    defaultCategories, 
    isLoading,
    error
  ]);
  
  return (
    <CategoryDataContext.Provider value={contextValue}>
      {children}
    </CategoryDataContext.Provider>
  );
}

// Custom hook to use the category data context
export function useCategoryData(): CategoryDataContextType {
  const context = useContext(CategoryDataContext);
  
  if (context === undefined) {
    throw new Error('useCategoryData must be used within a CategoryDataProvider');
  }
  
  return context;
}
