// FilterSortContext unit tests
// These tests validate the context that manages filtering and sorting state

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FilterSortProvider, useFilterSort } from '../FilterSortContext';

// Test component that uses the FilterSortContext
const TestComponent = () => {
  const { 
    filters, setFilters, clearFilters,
    sortCriteria, setSortCriteria,
    groupBy, setGroupBy,
    searchTerm, setSearchTerm
  } = useFilterSort();
  
  return (
    <div>
      <div data-testid="filters">{JSON.stringify(filters)}</div>
      <div data-testid="sortCriteria">{JSON.stringify(sortCriteria)}</div>
      <div data-testid="groupBy">{JSON.stringify(groupBy)}</div>
      <div data-testid="searchTerm">{searchTerm}</div>
      
      <button 
        data-testid="add-filter" 
        onClick={() => setFilters([...filters, { field: 'priority', operator: 'eq', value: 'high' }])}
      >
        Add Priority Filter
      </button>
      
      <button 
        data-testid="clear-filters" 
        onClick={() => clearFilters()}
      >
        Clear Filters
      </button>
      
      <button 
        data-testid="set-sort" 
        onClick={() => setSortCriteria({ field: 'due_date', direction: 'asc' })}
      >
        Sort by Due Date
      </button>
      
      <button 
        data-testid="set-group" 
        onClick={() => setGroupBy({ field: 'category_name' })}
      >
        Group by Category
      </button>
      
      <input 
        data-testid="search-input" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
    </div>
  );
};

describe('FilterSortContext', () => {
  test('provides default values', () => {
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Verify default state values
    expect(screen.getByTestId('filters').textContent).toBe('[]');
    expect(screen.getByTestId('sortCriteria').textContent).toBe('{}');
    expect(screen.getByTestId('groupBy').textContent).toBe('{}');
    expect(screen.getByTestId('searchTerm').textContent).toBe('');
  });
  
  test('updates filters correctly', () => {
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Add a filter
    fireEvent.click(screen.getByTestId('add-filter'));
    
    // Verify filter was added
    expect(screen.getByTestId('filters').textContent).toContain('priority');
    expect(screen.getByTestId('filters').textContent).toContain('high');
    
    // Clear filters
    fireEvent.click(screen.getByTestId('clear-filters'));
    
    // Verify filters were cleared
    expect(screen.getByTestId('filters').textContent).toBe('[]');
  });
  
  test('updates sort criteria correctly', () => {
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Set sort criteria
    fireEvent.click(screen.getByTestId('set-sort'));
    
    // Verify sort criteria was updated
    expect(screen.getByTestId('sortCriteria').textContent).toContain('due_date');
    expect(screen.getByTestId('sortCriteria').textContent).toContain('asc');
  });
  
  test('updates group by correctly', () => {
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Set group by
    fireEvent.click(screen.getByTestId('set-group'));
    
    // Verify group by was updated
    expect(screen.getByTestId('groupBy').textContent).toContain('category_name');
  });
  
  test('updates search term correctly', () => {
    render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Set search term
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test search' } });
    
    // Verify search term was updated
    expect(screen.getByTestId('searchTerm').textContent).toBe('test search');
  });
  
  test('maintains state between renders', () => {
    const { rerender } = render(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Set up various filter states
    fireEvent.click(screen.getByTestId('add-filter'));
    fireEvent.click(screen.getByTestId('set-sort'));
    fireEvent.click(screen.getByTestId('set-group'));
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'important' } });
    
    // Rerender the component
    rerender(
      <FilterSortProvider>
        <TestComponent />
      </FilterSortProvider>
    );
    
    // Verify state persists
    expect(screen.getByTestId('filters').textContent).toContain('priority');
    expect(screen.getByTestId('sortCriteria').textContent).toContain('due_date');
    expect(screen.getByTestId('groupBy').textContent).toContain('category_name');
    expect(screen.getByTestId('searchTerm').textContent).toBe('important');
  });
});
