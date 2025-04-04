import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/api/categoryService';
import { Category } from '../../services/interfaces/ICategoryService';
import { CATEGORIES } from '../../types/categories';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../lib/auth';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Cache keys for React Query
export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all, 'list'] as const,
  list: (filter?: string) => [...CATEGORY_QUERY_KEYS.lists(), filter] as const,
  defaults: () => [...CATEGORY_QUERY_KEYS.all, 'defaults'] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
};

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
  // Get authentication state
  const { user, loading: authLoading } = useAuth();
  
  // Get toast notifications
  const { addToast } = useToast();

  // Get query client from React Query
  const queryClient = useQueryClient();

  // The main categories query
  const { 
    data: categories = [], 
    isLoading: categoriesLoading, 
    error: categoriesError,
    refetch: refetchCategories
  } = useQuery({
    queryKey: CATEGORY_QUERY_KEYS.lists(),
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await categoryService.getCategories();
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Query for default categories
  const { 
    data: defaultCategories = [], 
    isLoading: defaultsLoading,
    error: defaultsError
  } = useQuery({
    queryKey: CATEGORY_QUERY_KEYS.defaults(),
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await categoryService.getDefaultCategories();
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Overall loading state
  const isLoading = categoriesLoading || defaultsLoading || authLoading;

  // Error handling
  const error = categoriesError instanceof Error 
    ? categoriesError.message 
    : (defaultsError instanceof Error ? defaultsError.message : null);

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async ({ 
      name, 
      subcategories, 
      color, 
      icon, 
      isDefault 
    }: { 
      name: string; 
      subcategories?: string[]; 
      color?: string; 
      icon?: string; 
      isDefault?: boolean 
    }) => {
      if (!user) {
        throw new Error('You must be logged in to create categories');
      }
      
      const { data, error } = await categoryService.createCategory({
        name,
        subcategories,
        color,
        icon,
        is_default: isDefault
      });
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (newCategory) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
      
      // If it's a default category, also invalidate defaults
      if (newCategory?.is_default) {
        queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.defaults() });
      }
      
      // Optimistically update cache
      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.detail(newCategory?.id as string),
        newCategory
      );
      
      addToast(`Category ${newCategory?.name} created successfully`, 'success');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      
      if (isDevelopment) {
        console.error('Error creating category:', error);
      }
      
      if (!errorMessage.includes('must be logged in')) {
        addToast(errorMessage, 'error');
      }
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: { 
        name?: string; 
        subcategories?: string[]; 
        color?: string; 
        icon?: string; 
        isDefault?: boolean 
      } 
    }) => {
      if (!user) {
        throw new Error('You must be logged in to update categories');
      }
      
      // Convert from client-side field names to server-side
      const serverData = {
        name: data.name,
        subcategories: data.subcategories,
        color: data.color,
        icon: data.icon,
        is_default: data.isDefault
      };
      
      const { data: updatedCategory, error } = await categoryService.updateCategory(id, serverData);
      
      if (error) throw error;
      
      return updatedCategory;
    },
    onSuccess: (updatedCategory) => {
      if (!updatedCategory) return;
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
      
      // If it might affect default status, invalidate defaults too
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.defaults() });
      
      // Optimistically update cache
      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.detail(updatedCategory.id),
        updatedCategory
      );
      
      addToast('Category updated successfully', 'success');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      
      if (isDevelopment) {
        console.error('Error updating category:', error);
      }
      
      if (!errorMessage.includes('must be logged in')) {
        addToast(errorMessage, 'error');
      }
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('You must be logged in to delete categories');
      }
      
      const { error } = await categoryService.deleteCategory(id);
      
      if (error) throw error;
      
      return id;
    },
    onSuccess: (deletedId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: CATEGORY_QUERY_KEYS.detail(deletedId) });
      
      addToast('Category deleted successfully', 'success');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      
      if (isDevelopment) {
        console.error('Error deleting category:', error);
      }
      
      if (!errorMessage.includes('must be logged in')) {
        addToast(errorMessage, 'error');
      }
    }
  });

  // Set default category mutation
  const setDefaultCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('You must be logged in to set default categories');
      }
      
      const { error } = await categoryService.setDefaultCategory(id);
      
      if (error) throw error;
      
      return id;
    },
    onSuccess: () => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.defaults() });
      
      addToast('Default category updated', 'success');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set default category';
      
      if (isDevelopment) {
        console.error('Error setting default category:', error);
      }
      
      if (!errorMessage.includes('must be logged in')) {
        addToast(errorMessage, 'error');
      }
    }
  });

  // API handlers with a similar interface to the old implementation
  const createCategory = async (
    name: string,
    subcategories?: string[],
    color?: string,
    icon?: string,
    isDefault?: boolean
  ): Promise<Category | null> => {
    try {
      const result = await createCategoryMutation.mutateAsync({
        name,
        subcategories,
        color,
        icon,
        isDefault
      });
      return result || null;
    } catch (err) {
      // Error handling is done in the mutation itself
      return null;
    }
  };

  const updateCategory = async (
    id: string,
    data: { name?: string; subcategories?: string[]; color?: string; icon?: string; isDefault?: boolean }
  ): Promise<Category | null> => {
    try {
      const result = await updateCategoryMutation.mutateAsync({ id, data });
      return result || null;
    } catch (err) {
      // Error handling is done in the mutation itself
      return null;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
      return true;
    } catch (err) {
      // Error handling is done in the mutation itself
      return false;
    }
  };

  const setDefaultCategory = async (id: string): Promise<boolean> => {
    try {
      await setDefaultCategoryMutation.mutateAsync(id);
      return true;
    } catch (err) {
      // Error handling is done in the mutation itself
      return false;
    }
  };

  // Refresh categories (for when data changes)
  const refreshCategories = async (): Promise<void> => {
    if (!user) return;
    await refetchCategories();
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
  const contextValue = useMemo<CategoryDataContextType>(() => ({
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
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    setDefaultCategory,
    getCategoryById,
    getSubcategoriesForCategory,
    refreshCategories
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
