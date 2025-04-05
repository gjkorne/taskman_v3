import React from 'react';
import { render } from '@testing-library/react';
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
      setSearchQuery: jest.fn(),
      isQuickFilterActive: jest.fn().mockReturnValue(false)
    })
  };
});

// Mock the cn utility to return class names unchanged
jest.mock('../../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

describe('FilterBar Snapshots', () => {
  it('should match snapshot with default props', () => {
    const { container } = render(
      <FilterSortProvider>
        <FilterBar />
      </FilterSortProvider>
    );
    expect(container).toMatchSnapshot();
  });
  
  it('should match snapshot with task count display', () => {
    const { container } = render(
      <FilterSortProvider>
        <FilterBar showTaskCount={true} taskCount={10} filteredCount={5} />
      </FilterSortProvider>
    );
    expect(container).toMatchSnapshot();
  });
  
  it('should match snapshot with active filters', () => {
    // Override the mock to show active filters
    const { useFilterSort } = require('../../../contexts/filterSort');
    useFilterSort.mockReturnValue({
      filters: [
        { field: 'priority', operator: 'in', value: ['high'] }
      ],
      clearFilters: jest.fn(),
      sortCriteria: { field: 'priority', direction: 'desc' },
      setSortCriteria: jest.fn(),
      groupBy: null,
      setGroupBy: jest.fn(),
      applyQuickFilter: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      isQuickFilterActive: jest.fn().mockImplementation(name => name === 'high-priority')
    });
    
    const { container } = render(
      <FilterSortProvider>
        <FilterBar />
      </FilterSortProvider>
    );
    expect(container).toMatchSnapshot();
  });
});
