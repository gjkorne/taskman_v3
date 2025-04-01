import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Category, categoryService } from '../services/api/categoryService';
import { CATEGORIES } from '../types/categories';
import { useToast } from '../components/Toast';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Define context type
interface CategoryContextType {
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

// Create context
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Provider component
export function CategoryProvider({ children }: { children: ReactNode }) {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get toast notifications
  const { addToast } = useToast();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch all categories
  const fetchCategories = async () => {
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
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh categories (for when data changes)
  const refreshCategories = async () => {
    return fetchCategories();
  };
  
  // Create a new category
  const createCategory = async (
    name: string,
    subcategories?: string[],
    color?: string,
    icon?: string,
    isDefault?: boolean
  ): Promise<Category | null> => {
    try {
      const { data, error: createError } = await categoryService.createCategory({
        name,
        subcategories,
        color,
        icon,
        is_default: isDefault
      });
      
      if (createError) throw createError;
      
      if (data) {
        // Update local state
        setCategories(prev => [...prev, data]);
        
        // If default, update default categories
        if (data.is_default) {
          setDefaultCategories([data]);
        }
        
        // Show success toast
        addToast(`Category '${name}' created successfully`, 'success');
        
        return data;
      }
      
      return null;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create category';
      
      if (isDevelopment) {
        console.error('Error creating category:', err);
      }
      
      addToast(errorMessage, 'error');
      return null;
    }
  };
  
  // Update a category
  const updateCategory = async (
    id: string,
    data: {
      name?: string;
      subcategories?: string[];
      color?: string;
      icon?: string;
      isDefault?: boolean;
    }
  ): Promise<Category | null> => {
    try {
      // Convert the data to expected format
      const updateData = {
        name: data.name,
        subcategories: data.subcategories,
        color: data.color,
        icon: data.icon,
        is_default: data.isDefault
      };
      
      const { data: updatedCategory, error: updateError } = await categoryService.updateCategory(id, updateData);
      
      if (updateError) throw updateError;
      
      if (updatedCategory) {
        // Update local state
        setCategories(prev => prev.map(cat => 
          cat.id === id ? updatedCategory : cat
        ));
        
        // If default changed, update default categories
        if (data.isDefault) {
          setDefaultCategories([updatedCategory]);
        } else if (updatedCategory.is_default) {
          // This is still a default category
          setDefaultCategories(prev => prev.map(cat => 
            cat.id === id ? updatedCategory : cat
          ));
        }
        
        // Show success toast
        addToast(`Category '${updatedCategory.name}' updated successfully`, 'success');
        
        return updatedCategory;
      }
      
      return null;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update category';
      
      if (isDevelopment) {
        console.error('Error updating category:', err);
      }
      
      addToast(errorMessage, 'error');
      return null;
    }
  };
  
  // Delete a category
  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      // Get the category to be deleted (for the name in the toast)
      const categoryToDelete = categories.find(cat => cat.id === id);
      
      const { error: deleteError } = await categoryService.deleteCategory(id);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      // If it was a default category, remove from defaults too
      setDefaultCategories(prev => prev.filter(cat => cat.id !== id));
      
      // Show success toast
      if (categoryToDelete) {
        addToast(`Category '${categoryToDelete.name}' deleted successfully`, 'success');
      } else {
        addToast('Category deleted successfully', 'success');
      }
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete category';
      
      if (isDevelopment) {
        console.error('Error deleting category:', err);
      }
      
      addToast(errorMessage, 'error');
      return false;
    }
  };
  
  // Set a category as default
  const setDefaultCategory = async (id: string): Promise<boolean> => {
    try {
      const { error: defaultError } = await categoryService.setDefaultCategory(id);
      
      if (defaultError) throw defaultError;
      
      // Get the updated category
      const { data: updatedCategory } = await categoryService.getCategoryById(id);
      
      if (updatedCategory) {
        // Update local state
        setCategories(prev => prev.map(cat => 
          cat.id === id ? updatedCategory : { ...cat, is_default: false }
        ));
        
        // Update default categories
        setDefaultCategories([updatedCategory]);
        
        // Show success toast
        addToast(`'${updatedCategory.name}' set as default category`, 'success');
      }
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to set default category';
      
      if (isDevelopment) {
        console.error('Error setting default category:', err);
      }
      
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
  const getBuiltInCategories = () => {
    return CATEGORIES;
  };

  // Context value
  const value: CategoryContextType = {
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
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

// Custom hook to use the category context
export function useCategories() {
  const context = useContext(CategoryContext);
  
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  
  return context;
}
