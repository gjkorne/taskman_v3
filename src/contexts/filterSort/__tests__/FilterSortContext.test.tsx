import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterSortProvider, useFilterSort } from '../FilterSortContext';
import { ServiceRegistry } from '../../../services/ServiceRegistry';

// Mock the service registry and filterSortService
jest.mock('../../../services/ServiceRegistry', () => ({
  getFilterSortService: jest.fn().mockReturnValue({
    createPresetFilter: jest.fn((presetName) => {
      if (presetName === 'high-priority') {
        return [{ field: 'priority', operator: 'in', value: ['high'] }];
      }
      if (presetName === 'work') {
        return [{ field: 'category_name', operator: 'in', value: ['Work'] }];
      }
      return [];
    }),
    getUserFilters: jest.fn().mockResolvedValue([]),
    saveUserFilters: jest.fn().mockResolvedValue(undefined)
  })
}));

// Mock auth hook
jest.mock('../../../lib/auth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user-123' }
  })
}));

// Test component that uses the FilterSortContext
const TestComponent = () => {
  const { 
    filters, 
    setFilters, 
    clearFilters, 
    applyQuickFilter, 
    sortCriteria, 
    setSortCriteria,
    searchQuery,
    setSearchQuery
  } = useFilterSort();
  
  return (
    <div>
      <div data-testid="filter-count">{filters.length}</div>
      <div data-testid="sort-field">{sortCriteria.field}</div>
      <div data-testid="search-query">{searchQuery}</div>
      
      <button 
        data-testid="apply-high-priority"
        onClick={() => applyQuickFilter('high-priority')}
      >
        Apply High Priority
      </button>
      
      <button 
        data-testid="clear-filters"
        onClick={clearFilters}
      >
        Clear Filters
      </button>
      
      <button 
        data-testid="set-work-filter"
        onClick={() => setFilters([{ field: 'category_name', operator: 'in', value: ['Work'] }])}
      >
        Set Work Filter
      </button>
      
      <button 
        data-testid="change-sort"
        onClick={() => setSortCriteria({ field: 'priority', direction: 'desc' })}
      >
        Sort by Priority
      </button>
      
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

describe('FilterSortContext', () => {
  it('provides default values', async () => {
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Check default values
    expect(screen.getByTestId('filter-count').textContent).toBe('0');
    expect(screen.getByTestId('sort-field').textContent).toBe('created_at');
    expect(screen.getByTestId('search-query').textContent).toBe('');
  });
  
  it('applies quick filters', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Apply high priority filter
    await user.click(screen.getByTestId('apply-high-priority'));
    
    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('filter-count').textContent).toBe('1');
    });
    
    // Should have called createPresetFilter on the service
    expect(ServiceRegistry.getFilterSortService().createPresetFilter).toHaveBeenCalledWith('high-priority');
  });
  
  it('clears filters', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // First set a filter
    await user.click(screen.getByTestId('set-work-filter'));
    
    // Verify filter is set
    await waitFor(() => {
      expect(screen.getByTestId('filter-count').textContent).toBe('1');
    });
    
    // Clear filters
    await user.click(screen.getByTestId('clear-filters'));
    
    // Verify filters are cleared
    await waitFor(() => {
      expect(screen.getByTestId('filter-count').textContent).toBe('0');
    });
  });
  
  it('changes sort criteria', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Change sort criteria
    await user.click(screen.getByTestId('change-sort'));
    
    // Verify sort criteria is updated
    await waitFor(() => {
      expect(screen.getByTestId('sort-field').textContent).toBe('priority');
    });
  });
  
  it('updates search query', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Type in search input
    await user.type(screen.getByTestId('search-input'), 'meeting');
    
    // Verify search query is updated
    await waitFor(() => {
      expect(screen.getByTestId('search-query').textContent).toBe('meeting');
    });
  });
});
