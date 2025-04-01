/**
 * Utility functions for task filtering and sorting
 */
import { Task } from '../components/TaskList/TaskCard';
import { TaskFilter } from '../components/TaskList/FilterPanel';
import { getTaskCategory } from './categoryUtils';

/**
 * Filter tasks based on filter criteria
 */
export function filterTasks(tasks: Task[], filters: TaskFilter): Task[] {
  return tasks.filter(task => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }

    // Category filter
    if (filters.category.length > 0) {
      const taskCategory = getTaskCategory(task);
      if (!taskCategory || !filters.category.includes(taskCategory)) {
        return false;
      }
    }

    // Show completed filter
    if (!filters.showCompleted && task.status === 'completed') {
      return false;
    }

    return true;
  });
}

/**
 * Sort tasks based on sort criteria
 */
export function sortTasks(tasks: Task[], sortBy: TaskFilter['sortBy'], sortOrder: 'asc' | 'desc'): Task[] {
  const sortedTasks = [...tasks];

  sortedTasks.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'priority': {
        const priorityRank = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const rankA = priorityRank[a.priority as keyof typeof priorityRank] || 0;
        const rankB = priorityRank[b.priority as keyof typeof priorityRank] || 0;
        comparison = rankA - rankB;
        break;
      }
      case 'dueDate': {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        comparison = dateA - dateB;
        break;
      }
      case 'createdAt': {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
        break;
      }
      case 'title': {
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      }
      case 'status': {
        const statusRank = { 'active': 4, 'in_progress': 3, 'pending': 2, 'completed': 1 };
        const rankA = statusRank[a.status as keyof typeof statusRank] || 0;
        const rankB = statusRank[b.status as keyof typeof statusRank] || 0;
        comparison = rankA - rankB;
        break;
      }
      case 'category': {
        const categoryA = getTaskCategory(a) || '';
        const categoryB = getTaskCategory(b) || '';
        comparison = categoryA.localeCompare(categoryB);
        break;
      }
    }

    // Apply sort order
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sortedTasks;
}

/**
 * Apply both filtering and sorting to tasks
 */
export function filterAndSortTasks(tasks: Task[], filters: TaskFilter): Task[] {
  const filteredTasks = filterTasks(tasks, filters);
  return sortTasks(filteredTasks, filters.sortBy, filters.sortOrder);
}
