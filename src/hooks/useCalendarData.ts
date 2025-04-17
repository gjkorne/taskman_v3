import { useMemo } from 'react';
import { format } from 'date-fns';
import type { Task } from '../types/task';

/**
 * Hook to transform a list of tasks into a lookup by date for calendar views
 */
export function useCalendarData(tasks: Task[]) {
  const tasksByDate = useMemo<Record<string, Task[]>>(() => {
    return tasks.reduce((acc, task) => {
      if (task.due_date) {
        const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
      }
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  return { tasksByDate };
}
