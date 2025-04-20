import { ReactNode, useMemo, createContext } from 'react';
import { CategoryDataProvider, useCategoryData } from './CategoryDataContext';
import { CategoryUIProvider, useCategoryUI } from './CategoryUIContext';
import { Category } from '../../services/api/categoryService';
import { CATEGORIES } from '../../types/categories';

// Combined context type for backward compatibility
export interface CategoryContextType {
  // Data
  categories: Category[];
  defaultCategories: Category[];
  isLoading: boolean;
  error: string | null;

  // UI state
  isCategoryModalOpen: boolean;
  selectedCategoryId: string | null;
  showSubcategories: boolean;
  viewMode: 'list' | 'grid';

  // CRUD operations
  createCategory: (
    name: string,
    subcategories?: string[],
    color?: string,
    icon?: string,
    isDefault?: boolean
  ) => Promise<Category | null>;
  updateCategory: (
    id: string,
    data: {
      name?: string;
      subcategories?: string[];
      color?: string;
      icon?: string;
      isDefault?: boolean;
    }
  ) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  setDefaultCategory: (id: string) => Promise<boolean>;

  // Utility functions
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoriesForCategory: (categoryId: string) => string[];
  refreshCategories: () => Promise<void>;
  getBuiltInCategories: () => typeof CATEGORIES;

  // Modal controls
  openCategoryModal: (categoryId?: string) => void;
  closeCategoryModal: () => void;

  // Display controls
  toggleSubcategoriesVisibility: () => void;
  setViewMode: (mode: 'list' | 'grid') => void;
}

// Create context instance
export const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

// Combined provider that wraps both data and UI providers
// and provides backward compatibility with the old context
export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <CategoryDataProvider>
      <CategoryUIProvider>
        <LegacyBridge>{children}</LegacyBridge>
      </CategoryUIProvider>
    </CategoryDataProvider>
  );
};

// Bridge component to provide the legacy context
const LegacyBridge = ({ children }: { children: ReactNode }) => {
  const dataContext = useCategoryData();
  const uiContext = useCategoryUI();

  // Combine contexts for backward compatibility
  const combinedContext = useMemo(
    () => ({
      ...dataContext,
      ...uiContext,
    }),
    [dataContext, uiContext]
  );

  return (
    <CategoryContext.Provider value={combinedContext}>
      {children}
    </CategoryContext.Provider>
  );
};
