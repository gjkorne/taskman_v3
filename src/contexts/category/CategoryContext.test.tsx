import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { categoryService } from '../../services/api/categoryService';
import { CategoryProvider, useCategories } from './index';
import { ReactElement } from 'react';

// Mock auth and toast hooks used by CategoryDataProvider
vi.mock('../../lib/auth', () => ({ useAuth: () => ({ user: { id: 'user1' }, loading: false }) }));
vi.mock('../../components/Toast', () => ({ useToast: () => ({ addToast: vi.fn() }) }));

// Spy on categoryService methods with full Category shape
function setupServiceSpies() {
  vi.spyOn(categoryService, 'getCategories').mockResolvedValue({
    data: [
      { id: '1', name: 'Work', user_id: 'user1', color: null, icon: null, subcategories: [], is_default: false, created_at: '2025-04-18T00:00:00Z', updated_at: null }
    ], error: null
  });
  vi.spyOn(categoryService, 'getDefaultCategories').mockResolvedValue({
    data: [
      { id: 'd1', name: 'General', user_id: 'user1', color: null, icon: null, subcategories: [], is_default: true, created_at: '2025-04-18T00:00:00Z', updated_at: null }
    ], error: null
  });
  vi.spyOn(categoryService, 'createCategory').mockResolvedValue({
    data: { id: '2', name: 'New', user_id: 'user1', color: null, icon: null, subcategories: [], is_default: false, created_at: '2025-04-18T00:00:00Z', updated_at: null },
    error: null
  });
}

// Helper to render with React Query client
function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

function TestComponent() {
  const {
    categories,
    defaultCategories,
    isLoading,
    isCategoryModalOpen,
    selectedCategoryId,
    showSubcategories,
    viewMode,
    openCategoryModal,
    closeCategoryModal,
    toggleSubcategoriesVisibility,
    setViewMode,
    createCategory
  } = useCategories();

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="cat-count">{categories.length}</span>
      <span data-testid="def-count">{defaultCategories.length}</span>
      <span data-testid="modal">{isCategoryModalOpen ? 'open' : 'closed'}</span>
      <span data-testid="selected">{selectedCategoryId ?? 'none'}</span>
      <span data-testid="sub">{showSubcategories ? 'shown' : 'hidden'}</span>
      <span data-testid="view">{viewMode}</span>
      <button data-testid="open" onClick={() => openCategoryModal('x')} />
      <button data-testid="close" onClick={() => closeCategoryModal()} />
      <button data-testid="toggle" onClick={() => toggleSubcategoriesVisibility()} />
      <button data-testid="grid" onClick={() => setViewMode('grid')} />
      <button data-testid="create" onClick={() => createCategory('New', [], undefined, undefined, false)} />
    </div>
  );
}

describe('CategoryContext (merged data+UI)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupServiceSpies();
  });

  it('loads data and default UI state', async () => {
    renderWithClient(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>
    );
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('loaded'));
    expect(screen.getByTestId('cat-count')).toHaveTextContent('1');
    expect(screen.getByTestId('def-count')).toHaveTextContent('1');
    expect(screen.getByTestId('modal')).toHaveTextContent('closed');
    expect(screen.getByTestId('selected')).toHaveTextContent('none');
    expect(screen.getByTestId('sub')).toHaveTextContent('shown');
    expect(screen.getByTestId('view')).toHaveTextContent('list');
  });

  it('handles UI actions and createCategory', async () => {
    renderWithClient(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('loaded'));

    fireEvent.click(screen.getByTestId('open'));
    expect(screen.getByTestId('modal')).toHaveTextContent('open');
    expect(screen.getByTestId('selected')).toHaveTextContent('x');

    fireEvent.click(screen.getByTestId('close'));
    expect(screen.getByTestId('modal')).toHaveTextContent('closed');
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('none'));

    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('sub')).toHaveTextContent('hidden');

    fireEvent.click(screen.getByTestId('grid'));
    expect(screen.getByTestId('view')).toHaveTextContent('grid');

    fireEvent.click(screen.getByTestId('create'));
    await waitFor(() => expect(categoryService.createCategory).toHaveBeenCalledWith(
      { name: 'New', subcategories: [], color: undefined, icon: undefined, is_default: false }
    ));
  });
});
