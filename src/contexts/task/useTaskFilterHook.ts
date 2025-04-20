import { useState, useMemo } from 'react';
import { useTaskData } from './TaskDataContext';
import { filterTasks } from '../../lib/taskUtils';
import { TaskFilter, defaultFilters } from '../../components/TaskList/FilterPanel';
import type { Task } from '../../types/task';

// Core filter logic for use in tests
export function filterTasksCore(
  tasks: Task[],
  filters: TaskFilter,
  searchQuery: string = ''
): Task[] {
  return filterTasks(tasks, filters, searchQuery);
}

// Hook for task filtering and search
export default function useTaskFilterHook() {
  const { tasks } = useTaskData();
  const [filters, setFilters] = useState<TaskFilter>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const resetFilters = () => {
    setSearchQuery('');
    setFilters(defaultFilters);
  };
  const filteredTasks = useMemo(() => filterTasksCore(tasks, filters, searchQuery), [tasks, filters, searchQuery]);
  return { tasks, filteredTasks, searchQuery, filters, setSearchQuery, setFilters, resetFilters };
}
