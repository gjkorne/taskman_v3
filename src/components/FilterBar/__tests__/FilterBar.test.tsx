import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../FilterBar';
import { FilterSortProvider } from '../../../contexts/filterSort';

// Mock the FilterSortContext hook
jest.mock('../../../contexts/filterSort', () => {
  const actual = jest.requireActual('../../../contexts/filterSort');
  return {
    ...actual,
    useFilterSort: jest.fn().mockReturnValue({
      filters: [],
      clearFilters: jest.fn(),
      sortCriteria: { field: 'created_at', direction: 'desc' },
      setSortCriteria: jest.fn(),
      groupBy: null,
      setGroupBy: jest.fn(),
      applyQuickFilter: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn()
    })
  };
});

// Mock the cn utility to return class names unchanged
jest.mock('../../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

describe('FilterBar', () => {
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Update the mock to reset values
    const { useFilterSort } = require('../../../contexts/filterSort');
    useFilterSort.mockReturnValue({
      filters: [],
      clearFilters: jest.fn(),
      sortCriteria: { field: 'created_at', direction: 'desc' },
      setSortCriteria: jest.fn(),
      groupBy: null,
      setGroupBy: jest.fn(),
      applyQuickFilter: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn()
    });
  });
  
  it('renders the search input', () => {
    render(<FilterBar />);
    
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });
  
  it('renders quick filter buttons', () => {
    render(<FilterBar />);
    
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Due Today')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });
  
  it('displays sort controls', () => {
    render(<FilterBar />);
    
    // Check for sort dropdown
    const sortDropdown = screen.getByRole('combobox', { name: '' });
    expect(sortDropdown).toBeInTheDocument();
    
    // Check for sort direction button
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });
  
  it('calls applyQuickFilter when a quick filter button is clicked', async () => {
    const user = userEvent.setup();
    const { useFilterSort } = require('../../../contexts/filterSort');
    const applyQuickFilter = jest.fn();
    
    useFilterSort.mockReturnValue({
      filters: [],
      clearFilters: jest.fn(),
      sortCriteria: { field: 'created_at', direction: 'desc' },
      setSortCriteria: jest.fn(),
      groupBy: null,
      setGroupBy: jest.fn(),
      applyQuickFilter,
      searchQuery: '',
      setSearchQuery: jest.fn()
    });
    
    render(<FilterBar />);
    
    // Click the high priority filter
    await user.click(screen.getByText('High Priority'));
    
    // Check if the apply filter function was called with the right parameter
    expect(applyQuickFilter).toHaveBeenCalledWith('high-priority');
  });
  
  it('calls setSearchQuery when typing in search input', async () => {
    const user = userEvent.setup();
    const { useFilterSort } = require('../../../contexts/filterSort');
    const setSearchQuery = jest.fn();
    
    useFilterSort.mockReturnValue({
      filters: [],
      clearFilters: jest.fn(),
      sortCriteria: { field: 'created_at', direction: 'desc' },
      setSortCriteria: jest.fn(),
      groupBy: null,
      setGroupBy: jest.fn(),
      applyQuickFilter: jest.fn(),
      searchQuery: '',
      setSearchQuery
    });
    
    render(<FilterBar />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search tasks...');
    await user.type(searchInput, 'meeting');
    
    // Check if setSearchQuery was called with the input value
    expect(setSearchQuery).toHaveBeenCalledWith('meeting');
  });
  
  it('shows task count when specified', () => {
    render(<FilterBar showTaskCount={true} taskCount={10} filteredCount={5} />);
    
    expect(screen.getByText('Showing 5 of 10 tasks')).toBeInTheDocument();
  });
  
  it('calls clearFilters when clear filters button is clicked', async () => {
    const user = userEvent.setup();
    const { useFilterSort } = require('../../../contexts/filterSort');
    const clearFilters = jest.fn();
    
    // Mock having active filters
    useFilterSort.mockReturnValue({
      filters: [{ field: 'priority', operator: 'in', value: ['high'] }],
      clearFilters,
      sortCriteria: { field: 'created_at', direction: 'desc' },
      setSortCriteria: jest.fn(),
      groupBy: null,
      setGroupBy: jest.fn(),
      applyQuickFilter: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn()
    });
    
    render(<FilterBar />);
    
    // Click the clear filters button
    await user.click(screen.getByText('Clear Filters'));
    
    // Check if clearFilters was called
    expect(clearFilters).toHaveBeenCalled();
  });
  
  it('highlights active filters', () => {
    const { useFilterSort } = require('../../../contexts/filterSort');
    
    // Mock having high priority filter active
    useFilterSort.mockReturnValue({
      filters: [{ field: 'priority', operator: 'in', value: ['high'] }],
      clearFilters: jest.fn(),
      sortCriteria: { field: 'created_at', direction: 'desc' },
      setSortCriteria: jest.fn(),
      groupBy: null,
      setGroupBy: jest.fn(),
      applyQuickFilter: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      isQuickFilterActive: jest.fn().mockImplementation(filterName => filterName === 'high-priority')
    });
    
    render(<FilterBar />);
    
    // Check that the High Priority button has the active class (contains bg-red-100)
    // This is a simplification - in reality would need to check the actual styling
    const highPriorityButton = screen.getByText('High Priority');
    expect(highPriorityButton.className).toContain('bg-red-100 text-red-800');
  });
});
