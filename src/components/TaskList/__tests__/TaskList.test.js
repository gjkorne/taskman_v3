// TaskList component tests
// Tests the main component responsible for displaying filtered and sorted tasks

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TaskList } from '../TaskList';
import { FilterSortProvider } from '../../../contexts/filterSort/FilterSortContext';
import { TasksProvider } from '../../../contexts/tasks/TasksContext';

// Mock tasks that will be provided by our mock TasksContext
const mockTasks = [
  { 
    id: '1', 
    title: 'Complete project proposal', 
    description: 'Finish the draft for the new client project',
    priority: 'high', 
    category_id: '1',
    category_name: 'Work',
    due_date: '2025-04-10',
    status: 'in_progress'
  },
  { 
    id: '2', 
    title: 'Buy groceries', 
    description: 'Get items for dinner party',
    priority: 'medium', 
    category_id: '2',
    category_name: 'Personal',
    due_date: '2025-04-05',
    status: 'not_started'
  },
  { 
    id: '3', 
    title: 'Schedule team meeting', 
    description: 'Coordinate with team for weekly sync',
    priority: 'low', 
    category_id: '1',
    category_name: 'Work',
    due_date: '2025-04-15',
    status: 'not_started'
  }
];

// Mock TasksContext implementation
jest.mock('../../../contexts/tasks/TasksContext', () => ({
  useTasks: () => ({
    tasks: mockTasks,
    loading: false,
    error: null,
    refreshTasks: jest.fn()
  }),
  TasksProvider: ({ children }) => <div data-testid="tasks-provider">{children}</div>
}));

// Mock ServiceRegistry for filter/sort service
jest.mock('../../../services/ServiceRegistry', () => ({
  ServiceRegistry: {
    getService: jest.fn().mockImplementation((serviceName) => {
      if (serviceName === 'FilterSortService') {
        return {
          applyFilters: (tasks, filters) => {
            if (!filters || filters.length === 0) return tasks;
            
            return tasks.filter(task => {
              return filters.every(filter => {
                const { field, operator, value } = filter;
                
                if (operator === 'eq') {
                  return task[field] === value;
                }
                
                return true;
              });
            });
          },
          applySorting: (tasks, sortCriteria) => {
            if (!sortCriteria || !sortCriteria.field) return tasks;
            
            const { field, direction = 'asc' } = sortCriteria;
            
            return [...tasks].sort((a, b) => {
              if (field === 'priority') {
                const priorityValues = { high: 3, medium: 2, low: 1 };
                const aValue = priorityValues[a[field]] || 0;
                const bValue = priorityValues[b[field]] || 0;
                
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
              }
              
              return 0;
            });
          },
          applyGrouping: (tasks, groupCriteria) => {
            if (!groupCriteria || !groupCriteria.field) return { default: tasks };
            
            const { field } = groupCriteria;
            
            return tasks.reduce((groups, task) => {
              const groupKey = task[field] || 'undefined';
              if (!groups[groupKey]) {
                groups[groupKey] = [];
              }
              groups[groupKey].push(task);
              return groups;
            }, {});
          }
        };
      }
      return null;
    })
  }
}));

describe('TaskList Component', () => {
  test('renders tasks correctly with default props', async () => {
    render(
      <FilterSortProvider>
        <TasksProvider>
          <TaskList />
        </TasksProvider>
      </FilterSortProvider>
    );
    
    // Wait for tasks to be rendered
    await waitFor(() => {
      // Verify all task titles are present
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Schedule team meeting')).toBeInTheDocument();
    });
  });
  
  test('renders FilterBar when showFilters is true', async () => {
    render(
      <FilterSortProvider>
        <TasksProvider>
          <TaskList showFilters={true} />
        </TasksProvider>
      </FilterSortProvider>
    );
    
    // Wait for component to render
    await waitFor(() => {
      // This test relies on the structure of your FilterBar component
      // Adjust according to your actual implementation
      const filterBar = screen.getByTestId('filter-bar');
      expect(filterBar).toBeInTheDocument();
    });
  });
  
  test('renders loading state when tasks are loading', async () => {
    // Override the mock for this test
    jest.spyOn(require('../../../contexts/tasks/TasksContext'), 'useTasks').mockImplementation(() => ({
      tasks: [],
      loading: true,
      error: null,
      refreshTasks: jest.fn()
    }));
    
    render(
      <FilterSortProvider>
        <TasksProvider>
          <TaskList />
        </TasksProvider>
      </FilterSortProvider>
    );
    
    // Verify loading state is displayed
    await waitFor(() => {
      const loadingElement = screen.getByText(/loading/i);
      expect(loadingElement).toBeInTheDocument();
    });
    
    // Clean up mock
    jest.restoreAllMocks();
  });
  
  test('renders error state when there is an error loading tasks', async () => {
    // Override the mock for this test
    jest.spyOn(require('../../../contexts/tasks/TasksContext'), 'useTasks').mockImplementation(() => ({
      tasks: [],
      loading: false,
      error: 'Failed to load tasks',
      refreshTasks: jest.fn()
    }));
    
    render(
      <FilterSortProvider>
        <TasksProvider>
          <TaskList />
        </TasksProvider>
      </FilterSortProvider>
    );
    
    // Verify error state is displayed
    await waitFor(() => {
      const errorElement = screen.getByText(/failed to load tasks/i);
      expect(errorElement).toBeInTheDocument();
    });
    
    // Clean up mock
    jest.restoreAllMocks();
  });
  
  test('renders empty state when there are no tasks', async () => {
    // Override the mock for this test
    jest.spyOn(require('../../../contexts/tasks/TasksContext'), 'useTasks').mockImplementation(() => ({
      tasks: [],
      loading: false,
      error: null,
      refreshTasks: jest.fn()
    }));
    
    render(
      <FilterSortProvider>
        <TasksProvider>
          <TaskList />
        </TasksProvider>
      </FilterSortProvider>
    );
    
    // Verify empty state is displayed
    await waitFor(() => {
      const emptyElement = screen.getByText(/no tasks found/i);
      expect(emptyElement).toBeInTheDocument();
    });
    
    // Clean up mock
    jest.restoreAllMocks();
  });
});
