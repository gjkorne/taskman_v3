import { createUIContext } from '../createUIContext';

export const { Provider: CategoryUIProvider, useUIContext: useCategoryUI } = createUIContext({
  displayName: 'Category',
  initialState: {
    isCategoryModalOpen: false,
    selectedCategoryId: null as string | null,
    showSubcategories: true,
    viewMode: 'list' as 'list' | 'grid',
  },
  actions: (_state, setState) => ({
    openCategoryModal: (categoryId?: string) => setState(s => ({
      ...s,
      isCategoryModalOpen: true,
      selectedCategoryId: categoryId ?? null,
    })),
    closeCategoryModal: () => {
      setState(s => ({ ...s, isCategoryModalOpen: false }));
      setTimeout(() => setState(s => ({ ...s, selectedCategoryId: null })), 300);
    },
    toggleSubcategoriesVisibility: () => setState(s => ({ ...s, showSubcategories: !s.showSubcategories })),
    setViewMode: (mode: 'list' | 'grid') => setState(s => ({ ...s, viewMode: mode })),
  }),
});
