import { useMemo, useCallback } from 'react';
import type { Category } from '../services/interfaces/ICategoryService';
import type { TaskModel } from '../types/models/TaskModel';

/**
 * Hook to derive and filter category/task data for the CategoriesPage
 */
export function useCategoriesPageData(
  categories: Category[],
  tasks: TaskModel[],
  showCompletedTasks: boolean,
  showEmptyCategories: boolean
) {
  const allCategories = useMemo(() => {
    const result = [...categories];
    const uniqueNames = new Set<string>();
    tasks.forEach(task => {
      if (task.categoryName && !task.isDeleted) {
        uniqueNames.add(task.categoryName.toLowerCase());
      }
    });
    uniqueNames.forEach(name => {
      const exists = result.some(cat => 
        cat.name.toLowerCase() === name
      );
      if (!exists) {
        result.push({
          id: `virtual-${name}`,
          name,
          user_id: '',
          color: null,
          icon: null,
          subcategories: null,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: null
        } as Category);
      }
    });
    return result;
  }, [categories, tasks]);

  const getTasksByCategory = useCallback(
    (categoryName: string) =>
      tasks.filter(task =>
        task.categoryName?.toLowerCase() === categoryName.toLowerCase() &&
        !task.isDeleted &&
        (showCompletedTasks || task.status !== 'completed')
      ),
    [tasks, showCompletedTasks]
  );

  const countActiveTasks = useCallback(
    (categoryName: string) =>
      tasks.filter(task =>
        task.categoryName?.toLowerCase() === categoryName.toLowerCase() &&
        !task.isDeleted &&
        task.status !== 'completed'
      ).length,
    [tasks]
  );

  const filteredCategories = useMemo(
    () => allCategories.filter(cat => showEmptyCategories || countActiveTasks(cat.name) > 0),
    [allCategories, showEmptyCategories, countActiveTasks]
  );

  return { allCategories, filteredCategories, getTasksByCategory, countActiveTasks };
}
