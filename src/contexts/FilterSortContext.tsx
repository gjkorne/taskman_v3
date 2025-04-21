import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Task } from '../types/task';
import { defaultFilters, TaskFilter } from '../components/TaskList/FilterPanel';
import { filterTasks } from '../lib/taskUtils';
import { useTaskApp } from './task/useTaskApp';

interface FilterSortContextType {
  filters: TaskFilter;
  setFilters: (filters: TaskFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  filteredTasks: Task[];
}

const FilterSortContext = createContext<FilterSortContextType | undefined>(
  undefined
);

export const FilterSortProvider = ({ children }: { children: ReactNode }) => {
  const { tasks } = useTaskApp();
  const [filters, setFilters] = useState<TaskFilter>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reset filters and search
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchQuery('');
  }, []);

  // Derive filtered tasks based on filters and search query
  const filteredTasks = useMemo(
    () => filterTasks(tasks, filters, searchQuery),
    [tasks, filters, searchQuery]
  );

  return (
    <FilterSortContext.Provider
      value={{ filters, setFilters, searchQuery, setSearchQuery, resetFilters, filteredTasks }}
    >
      {children}
    </FilterSortContext.Provider>
  );
};

/**
 * Hook to access filter & search context
 */
export const useFilterSort = () => {
  const context = useContext(FilterSortContext);
  if (!context) {
    throw new Error('useFilterSort must be used within a FilterSortProvider');
  }
  return context;
};
