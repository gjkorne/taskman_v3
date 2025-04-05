import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterSortProvider } from '../contexts/filterSort';
import { ServiceRegistry } from '../services/ServiceRegistry';

// Mock the service registry
jest.mock('../services/ServiceRegistry', () => ({
  getFilterSortService: jest.fn().mockReturnValue({
    createPresetFilter: jest.fn(),
    getUserFilters: jest.fn().mockResolvedValue([]),
    saveUserFilters: jest.fn().mockResolvedValue(undefined),
    applyFilters: jest.fn(items => items),
    applySorting: jest.fn(items => items),
    applyGrouping: jest.fn()
  }),
  initialize: jest.fn()
}));

// Mock the auth
jest.mock('../lib/auth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user' },
    loading: false
  })
}));

// Create a custom render function that includes providers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <FilterSortProvider>
          {children}
        </FilterSortProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
