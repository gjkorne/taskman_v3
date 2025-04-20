import { useCallback } from 'react';
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

export default function useCategoryDataHook() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery<Category[], Error>({
    queryKey: CATEGORY_QUERY_KEYS.lists(),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await categoryService.getCategories();
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    data: defaultCategories = [],
    isLoading: defaultsLoading,
    error: defaultsError,
  } = useQuery<Category[], Error>({
    queryKey: CATEGORY_QUERY_KEYS.defaults(),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await categoryService.getDefaultCategories();
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isLoading = categoriesLoading || defaultsLoading || authLoading;
  const error =
    categoriesError instanceof Error
      ? categoriesError.message
      : defaultsError instanceof Error
      ? defaultsError.message
      : null;

  const createCategoryMutation = useMutation({
    mutationFn: async ({
      name,
      subcategories,
      color,
      icon,
      isDefault,
    }: {
      name: string;
      subcategories?: string[];
      color?: string;
      icon?: string;
      isDefault?: boolean;
    }) => {
      if (!user) throw new Error('You must be logged in to create categories');
      const { data, error } = await categoryService.createCategory({
        name,
        subcategories,
        color,
        icon,
        is_default: isDefault,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
      if (newCategory?.is_default)
        queryClient.invalidateQueries({
          queryKey: CATEGORY_QUERY_KEYS.defaults(),
        });
      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.detail(newCategory?.id as string),
        newCategory
      );
      addToast(`Category ${newCategory?.name} created successfully`, 'success');
    },
    onError: (error) => {
      const msg =
        error instanceof Error ? error.message : 'Failed to create category';
      if (isDevelopment) console.error('Error creating category:', error);
      if (!msg.includes('must be logged in')) addToast(msg, 'error');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        subcategories?: string[];
        color?: string;
        icon?: string;
        isDefault?: boolean;
      };
    }) => {
      if (!user) throw new Error('You must be logged in to update categories');
      const serverData = {
        name: data.name,
        subcategories: data.subcategories,
        color: data.color,
        icon: data.icon,
        is_default: data.isDefault,
      };
      const { data: updatedCategory, error } =
        await categoryService.updateCategory(id, serverData);
      if (error) throw error;
      return updatedCategory;
    },
    onSuccess: (updatedCategory) => {
      if (!updatedCategory) return;
      queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
      if (updatedCategory?.is_default)
        queryClient.invalidateQueries({
          queryKey: CATEGORY_QUERY_KEYS.defaults(),
        });
      queryClient.setQueryData(
        CATEGORY_QUERY_KEYS.detail(updatedCategory.id),
        updatedCategory
      );
      addToast('Category updated successfully', 'success');
    },
    onError: (error) => {
      const msg =
        error instanceof Error ? error.message : 'Failed to update category';
      if (isDevelopment) console.error('Error updating category:', error);
      addToast(msg, 'error');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => categoryService.deleteCategory(id),
    onSuccess: (result, id) => {
      if (result) {
        queryClient.invalidateQueries({
          queryKey: CATEGORY_QUERY_KEYS.lists(),
        });
        queryClient.removeQueries({ queryKey: CATEGORY_QUERY_KEYS.detail(id) });
        addToast('Category deleted successfully', 'success');
      }
    },
    onError: (error) => {
      const msg =
        error instanceof Error ? error.message : 'Failed to delete category';
      if (isDevelopment) console.error('Error deleting category:', error);
      addToast(msg, 'error');
    },
  });

  const setDefaultCategory = useCallback(
    async (id: string) => {
      try {
        const success = await categoryService.setDefaultCategory(id);
        if (success) {
          queryClient.invalidateQueries({
            queryKey: CATEGORY_QUERY_KEYS.lists(),
          });
          queryClient.invalidateQueries({
            queryKey: CATEGORY_QUERY_KEYS.defaults(),
          });
          addToast('Default category set', 'success');
        }
        return success;
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : 'Failed to set default category';
        addToast(msg, 'error');
        return false;
      }
    },
    [queryClient, addToast]
  );

  const getCategoryById = useCallback(
    (id: string) => categories.find((cat) => cat.id === id),
    [categories]
  );
  const getSubcategoriesForCategory = useCallback(
    (categoryId: string) =>
      categories.find((c) => c.id === categoryId)?.subcategories || [],
    [categories]
  );
  const refreshCategories = useCallback(
    async () => refetchCategories(),
    [refetchCategories]
  );
  const getBuiltInCategories = useCallback(() => CATEGORIES, []);

  return {
    categories,
    defaultCategories,
    isLoading,
    error,
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    setDefaultCategory,
    getCategoryById,
    getSubcategoriesForCategory,
    refreshCategories,
    getBuiltInCategories,
  };
}
