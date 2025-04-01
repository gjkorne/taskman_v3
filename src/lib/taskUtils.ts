/**
 * Utility functions for task filtering and sorting
 */
import { Task } from '../components/TaskList/TaskCard';
import { TaskFilter } from '../components/TaskList/FilterPanel';
import { getTaskCategory } from './categoryUtils';

/**
 * Check if a task matches the search query
 */
function taskMatchesSearch(task: Task, searchQuery: string = ''): boolean {
  if (!searchQuery) return true;
  
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return true;
  
  // Detailed logging for troubleshooting 
  console.log(`Searching task "${task.title}" with query "${normalizedQuery}"`, {
    task_details: {
      id: task.id,
      title: task.title,
      category: task.category,
      category_name: task.category_name,
      category_type: typeof task.category,
      full_task: task
    },
    search_query: normalizedQuery
  });
  
  // Match against task content
  const matchesTitle = task.title.toLowerCase().includes(normalizedQuery);
  const matchesDescription = task.description?.toLowerCase()?.includes(normalizedQuery) || false;
  const matchesTags = task.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery)) || false;
  
  // Match against filter fields
  const matchesPriority = task.priority.toLowerCase().includes(normalizedQuery);
  const matchesStatus = task.status.toLowerCase().includes(normalizedQuery);
  
  // Special case for category searches when no category data exists
  const isSearchingForCategory = 
    normalizedQuery === 'work' || 
    normalizedQuery === 'personal' || 
    normalizedQuery === 'childcare';
    
  // If user is searching for a category but the task has no category, don't match
  if (isSearchingForCategory && task.category_name === null) {
    return false;
  }
  
  // Get category name (only use category_name field)
  const categoryName = task.category_name ? task.category_name.toLowerCase() : '';
  
  const matchesCategory = categoryName.includes(normalizedQuery);
  
  // Return true if any field matches
  return matchesTitle || matchesDescription || matchesTags || 
         matchesPriority || matchesStatus || matchesCategory;
}

/**
 * Filter tasks based on filter criteria and search query
 */
export function filterTasks(tasks: Task[], filters: TaskFilter, searchQuery: string = ''): Task[] {
  return tasks.filter(task => {
    // Search query filter
    if (!taskMatchesSearch(task, searchQuery)) {
      return false;
    }
    
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
export function filterAndSortTasks(tasks: Task[], filters: TaskFilter, searchQuery: string = ''): Task[] {
  const filteredTasks = filterTasks(tasks, filters, searchQuery);
  return sortTasks(filteredTasks, filters.sortBy, filters.sortOrder);
}

/**
 * Get the border color class for a task's priority
 */
export function getPriorityBorderColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'border-l-red-700'; // Level 10 - strongest visual impact
    case 'high':
      return 'border-l-amber-200'; // Even more muted
    case 'medium':
      return 'border-l-sky-100'; // Very muted
    case 'low':
      return 'border-l-emerald-100'; // Extremely subtle
    default:
      return 'border-l-gray-100'; // Nearly invisible
  }
}
