import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Types for the UI context
interface CategoryUIContextType {
  // UI state
  isCategoryModalOpen: boolean;
  selectedCategoryId: string | null;
  showSubcategories: boolean;
  viewMode: 'list' | 'grid';
  
  // Modal controls
  openCategoryModal: (categoryId?: string) => void;
  closeCategoryModal: () => void;
  
  // Display controls
  toggleSubcategoriesVisibility: () => void;
  setViewMode: (mode: 'list' | 'grid') => void;
}

// Create context with default values
export const CategoryUIContext = createContext<CategoryUIContextType | undefined>(undefined);

// Category UI Provider component
export const CategoryUIProvider = ({ children }: { children: ReactNode }) => {
  // UI state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Modal control functions
  const openCategoryModal = useCallback((categoryId?: string) => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    } else {
      setSelectedCategoryId(null); // null means creating a new category
    }
    setIsCategoryModalOpen(true);
  }, []);
  
  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    // Delayed cleanup to avoid UI flicker during modal transitions
    setTimeout(() => setSelectedCategoryId(null), 300);
  }, []);
  
  // Display control functions
  const toggleSubcategoriesVisibility = useCallback(() => {
    setShowSubcategories(prev => !prev);
  }, []);
  
  // Context value - using useMemo to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // UI state
    isCategoryModalOpen,
    selectedCategoryId,
    showSubcategories,
    viewMode,
    
    // Modal controls
    openCategoryModal,
    closeCategoryModal,
    
    // Display controls
    toggleSubcategoriesVisibility,
    setViewMode,
  }), [
    isCategoryModalOpen,
    selectedCategoryId,
    showSubcategories,
    viewMode,
    openCategoryModal,
    closeCategoryModal,
    toggleSubcategoriesVisibility
  ]);
  
  return (
    <CategoryUIContext.Provider value={value}>
      {children}
    </CategoryUIContext.Provider>
  );
};

// Custom hook to use category UI context
export const useCategoryUI = () => {
  const context = useContext(CategoryUIContext);
  
  if (context === undefined) {
    throw new Error('useCategoryUI must be used within a CategoryUIProvider');
  }
  
  return context;
};
