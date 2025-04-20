import { useState, useCallback } from 'react';
import { useCategories } from '../contexts/category';
import { Category } from '../services/interfaces/ICategoryService';
import { useToast } from '../components/Toast';

/**
 * Custom hook for managing categories and subcategories
 */
export function useCategoryManager() {
  const {
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
  } = useCategories();

  const { addToast } = useToast();

  // Local state for currently selected category and subcategory
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    defaultCategories.length > 0 ? defaultCategories[0].id : null
  );

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );

  /**
   * Get the currently selected category
   */
  const getSelectedCategory = useCallback((): Category | null => {
    if (!selectedCategoryId) return null;
    return getCategoryById(selectedCategoryId) || null;
  }, [selectedCategoryId, getCategoryById]);

  /**
   * Get subcategories for the currently selected category
   */
  const getSelectedCategorySubcategories = useCallback((): string[] => {
    if (!selectedCategoryId) return [];
    return getSubcategoriesForCategory(selectedCategoryId);
  }, [selectedCategoryId, getSubcategoriesForCategory]);

  /**
   * Add a new subcategory to the selected category
   */
  const addSubcategory = useCallback(
    async (subcategoryName: string): Promise<boolean> => {
      if (!selectedCategoryId) {
        addToast('No category selected', 'error');
        return false;
      }

      const category = getCategoryById(selectedCategoryId);
      if (!category) {
        addToast('Category not found', 'error');
        return false;
      }

      // Check if subcategory already exists
      const existingSubcategories = category.subcategories || [];
      if (existingSubcategories.includes(subcategoryName)) {
        addToast(`Subcategory '${subcategoryName}' already exists`, 'warning');
        return false;
      }

      // Add new subcategory
      const updatedSubcategories = [...existingSubcategories, subcategoryName];

      const result = await updateCategory(selectedCategoryId, {
        subcategories: updatedSubcategories,
      });

      return !!result;
    },
    [selectedCategoryId, getCategoryById, updateCategory, addToast]
  );

  /**
   * Remove a subcategory from the selected category
   */
  const removeSubcategory = useCallback(
    async (subcategoryName: string): Promise<boolean> => {
      if (!selectedCategoryId) {
        addToast('No category selected', 'error');
        return false;
      }

      const category = getCategoryById(selectedCategoryId);
      if (!category) {
        addToast('Category not found', 'error');
        return false;
      }

      // Filter out the subcategory
      const existingSubcategories = category.subcategories || [];
      const updatedSubcategories = existingSubcategories.filter(
        (sub: string) => sub !== subcategoryName
      );

      // If no change, return early
      if (updatedSubcategories.length === existingSubcategories.length) {
        addToast(`Subcategory '${subcategoryName}' not found`, 'warning');
        return false;
      }

      // Update the category
      const result = await updateCategory(selectedCategoryId, {
        subcategories: updatedSubcategories,
      });

      // If the removed subcategory was selected, clear the selection
      if (selectedSubcategory === subcategoryName) {
        setSelectedSubcategory(null);
      }

      return !!result;
    },
    [
      selectedCategoryId,
      selectedSubcategory,
      getCategoryById,
      updateCategory,
      addToast,
    ]
  );

  /**
   * Update a subcategory name
   */
  const renameSubcategory = useCallback(
    async (oldName: string, newName: string): Promise<boolean> => {
      if (!selectedCategoryId) {
        addToast('No category selected', 'error');
        return false;
      }

      const category = getCategoryById(selectedCategoryId);
      if (!category) {
        addToast('Category not found', 'error');
        return false;
      }

      // Check if subcategory exists
      const existingSubcategories = category.subcategories || [];
      const index = existingSubcategories.indexOf(oldName);

      if (index === -1) {
        addToast(`Subcategory '${oldName}' not found`, 'warning');
        return false;
      }

      // Check if new name already exists
      if (existingSubcategories.includes(newName)) {
        addToast(`Subcategory '${newName}' already exists`, 'warning');
        return false;
      }

      // Update the subcategory
      const updatedSubcategories = [...existingSubcategories];
      updatedSubcategories[index] = newName;

      const result = await updateCategory(selectedCategoryId, {
        subcategories: updatedSubcategories,
      });

      // If the renamed subcategory was selected, update the selection
      if (selectedSubcategory === oldName) {
        setSelectedSubcategory(newName);
      }

      return !!result;
    },
    [
      selectedCategoryId,
      selectedSubcategory,
      getCategoryById,
      updateCategory,
      addToast,
    ]
  );

  /**
   * Create new category with optional subcategories
   */
  const createNewCategory = useCallback(
    async (
      name: string,
      subcategories: string[] = [],
      color?: string,
      icon?: string,
      isDefault?: boolean
    ): Promise<Category | null> => {
      const result = await createCategory(
        name,
        subcategories,
        color,
        icon,
        isDefault
      );

      // If successful and is default or no category is selected, select this one
      if (result && (isDefault || selectedCategoryId === null)) {
        setSelectedCategoryId(result.id);
      }

      return result;
    },
    [createCategory, selectedCategoryId]
  );

  /**
   * Set the active category by ID
   */
  const setActiveCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    // Clear subcategory selection when changing categories
    setSelectedSubcategory(null);
  }, []);

  /**
   * Set the active subcategory by name
   */
  const setActiveSubcategory = useCallback((subcategory: string | null) => {
    setSelectedSubcategory(subcategory);
  }, []);

  /**
   * Make the selected category the default
   */
  const makeSelectedCategoryDefault =
    useCallback(async (): Promise<boolean> => {
      if (!selectedCategoryId) {
        addToast('No category selected', 'error');
        return false;
      }

      return await setDefaultCategory(selectedCategoryId);
    }, [selectedCategoryId, setDefaultCategory, addToast]);

  return {
    // Data
    categories,
    defaultCategories,
    isLoading,
    error,
    selectedCategoryId,
    selectedSubcategory,

    // Category CRUD operations
    createNewCategory,
    updateCategory,
    deleteCategory,
    setDefaultCategory,

    // Subcategory operations
    addSubcategory,
    removeSubcategory,
    renameSubcategory,

    // Selection management
    getSelectedCategory,
    getSelectedCategorySubcategories,
    setActiveCategory,
    setActiveSubcategory,
    makeSelectedCategoryDefault,

    // Utilities
    refreshCategories,
  };
}
