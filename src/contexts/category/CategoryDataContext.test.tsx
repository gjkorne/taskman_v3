import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { categoryService } from '../../services/api/categoryService';
import { CategoryDataProvider, useCategoryData } from './CategoryDataContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock authentication and toast
vi.mock('../../lib/auth', () => ({ useAuth: () => ({ user: { id: 'user1' }, loading: false }) }));
vi.mock('../../components/Toast', () => ({ useToast: () => ({ addToast: vi.fn() }) }));

// Spy on categoryService methods
function setupServiceSpies() {
  vi.spyOn(categoryService, 'getCategories').mockResolvedValue({
    data: [
      {
        id: '1',
        name: 'Work',
        user_id: 'user1',
        color: null,
        icon: null,
        subcategories: [],
        is_default: false,
        created_at: '2025-04-18T00:00:00Z',
        updated_at: null,
      },
    ],
    error: null,
  });
  vi.spyOn(categoryService, 'getDefaultCategories').mockResolvedValue({
    data: [
      {
        id: 'd1',
        name: 'General',
        user_id: 'user1',
        color: null,
        icon: null,
        subcategories: [],
        is_default: true,
        created_at: '2025-04-18T00:00:00Z',
        updated_at: null,
      },
    ],
    error: null,
  });
  vi.spyOn(categoryService, 'createCategory').mockResolvedValue({
    data: {
      id: '2',
      name: 'New',
      user_id: 'user1',
      color: null,
      icon: null,
      subcategories: [],
      is_default: false,
      created_at: '2025-04-18T00:00:00Z',
      updated_at: null,
    },
    error: null,
  });
}

// Test component to consume the context
function TestComponent() {
  const { categories, defaultCategories, isLoading, createCategory } = useCategoryData();
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'loaded'}</span>
      <ul>
        {categories.map(cat => (
          <li key={cat.id} data-testid={`category-${cat.id}`}>{cat.name}</li>
        ))}
      </ul>
      <ul>
        {defaultCategories.map(cat => (
          <li key={cat.id} data-testid={`default-${cat.id}`}>{cat.name}</li>
        ))}
      </ul>
      <button data-testid="create" onClick={() => createCategory('New', [], undefined, undefined, false)} />
    </div>
  );
}

// Helper to render with React Query client
function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('CategoryDataContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupServiceSpies();
  });

  it('loads categories and default categories', async () => {
    renderWithClient(
      <CategoryDataProvider>
        <TestComponent />
      </CategoryDataProvider>
    );
    expect(screen.getByTestId('loading').textContent).toBe('loading');
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loaded'));
    expect(screen.getByTestId('category-1')).toHaveTextContent('Work');
    expect(screen.getByTestId('default-d1')).toHaveTextContent('General');
  });

  it('creates a new category', async () => {
    renderWithClient(
      <CategoryDataProvider>
        <TestComponent />
      </CategoryDataProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loaded'));
    fireEvent.click(screen.getByTestId('create'));
    // Ensure createCategory service was called with correct payload
    await waitFor(() => expect(categoryService.createCategory).toHaveBeenCalled());
    expect(categoryService.createCategory).toHaveBeenCalledWith({
      name: 'New',
      subcategories: [],
      color: undefined,
      icon: undefined,
      is_default: false,
    });
  });
});
