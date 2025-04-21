import { useMemo } from 'react';
import { Task } from '../types/task';

/**
 * Hook to group tasks by category name.
 */
export function useTaskGrouping(tasks: Task[]): Record<string, Task[]> {
  return useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const category = task.category_name || 'Uncategorized';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(task);
    });
    return grouped;
  }, [tasks]);
}
