/**
 * Utility functions for task filtering and sorting
 */
import { Task } from '../types/task';
import { TaskFilter } from '../components/TaskList/FilterPanel';
import { getTaskCategory } from './categoryUtils';

// Debug flag - set to false in production
const DEBUG_FILTERING = false;

/**
 * DATE UTILITY FUNCTIONS
 */

/**
 * Format a Date object to YYYY-MM-DD for comparison
 */
const formatDateForCompare = (date: Date): string =>
  `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

/**
 * Get date ranges for filtering (today, tomorrow, this week, next week)
 */
function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Start of this week (Sunday)
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  // End of this week (Saturday)
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

  // Start of next week
  const nextWeekStart = new Date(thisWeekEnd);
  nextWeekStart.setDate(thisWeekEnd.getDate() + 1);

  // End of next week
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  return {
    today,
    tomorrow,
    thisWeekStart,
    thisWeekEnd,
    nextWeekStart,
    nextWeekEnd,
    todayFormatted: formatDateForCompare(today),
    tomorrowFormatted: formatDateForCompare(tomorrow),
  };
}

/**
 * Check if a task due date matches the filter criteria
 */
export function taskMatchesDueDate(
  task: Task,
  dueDateFilter: string[]
): boolean {
  if (!dueDateFilter.length) return true;
  if (!task.due_date) return dueDateFilter.includes('no_date');

  const dueDate = new Date(task.due_date);
  const {
    today,
    thisWeekStart,
    thisWeekEnd,
    nextWeekStart,
    nextWeekEnd,
    todayFormatted,
    tomorrowFormatted,
  } = getDateRanges();

  const dueDateFormatted = formatDateForCompare(dueDate);

  return dueDateFilter.some((filter) => {
    switch (filter) {
      case 'today':
        return dueDateFormatted === todayFormatted;

      case 'tomorrow':
        return dueDateFormatted === tomorrowFormatted;

      case 'this_week':
        return dueDate >= thisWeekStart && dueDate <= thisWeekEnd;

      case 'next_week':
        return dueDate >= nextWeekStart && dueDate <= nextWeekEnd;

      case 'overdue':
        return dueDate < today;

      case 'no_date':
        return !task.due_date;

      default:
        return false;
    }
  });
}

/**
 * TASK FILTERING FUNCTIONS
 */

/**
 * Check if a task matches the search query
 */
function taskMatchesSearch(task: Task, searchQuery: string = ''): boolean {
  if (!searchQuery) return true;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return true;

  // Log task details if debug is enabled
  if (DEBUG_FILTERING) {
    console.log(
      `Searching task "${task.title}" with query "${normalizedQuery}"`,
      {
        task_details: {
          id: task.id,
          title: task.title,
          category: task.category,
          category_name: task.category_name,
        },
      }
    );
  }

  // Match against task content
  const matchesTitle = task.title.toLowerCase().includes(normalizedQuery);
  const matchesDescription =
    task.description?.toLowerCase()?.includes(normalizedQuery) || false;
  const matchesTags =
    task.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
    false;

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
  const categoryName = task.category_name
    ? task.category_name.toLowerCase()
    : '';

  const matchesCategory = categoryName.includes(normalizedQuery);

  // Return true if any field matches
  return (
    matchesTitle ||
    matchesDescription ||
    matchesTags ||
    matchesPriority ||
    matchesStatus ||
    matchesCategory
  );
}

/**
 * Filter tasks based on filter criteria and search query
 */
export function filterTasks(
  tasks: Task[],
  filters: TaskFilter,
  searchQuery: string = ''
): Task[] {
  // IMPORTANT: Always extract active tasks first so they're always visible
  const activeTasks = tasks.filter((task) => task.status === 'active');
  const otherTasks = tasks.filter((task) => task.status !== 'active');

  // Filter the non-active tasks
  const filteredOtherTasks = otherTasks.filter((task) => {
    // Search query filter
    if (!taskMatchesSearch(task, searchQuery)) {
      if (DEBUG_FILTERING)
        console.log(
          'Filtering out task:',
          task.id,
          'due to search query mismatch'
        );
      return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      if (DEBUG_FILTERING)
        console.log(
          'Filtering out task:',
          task.id,
          'with status:',
          task.status
        );
      return false;
    }

    // Priority filter
    if (
      filters.priority.length > 0 &&
      !filters.priority.includes(task.priority)
    ) {
      if (DEBUG_FILTERING)
        console.log(
          'Filtering out task:',
          task.id,
          'with priority:',
          task.priority
        );
      return false;
    }

    // Category filter
    if (filters.category.length > 0) {
      const taskCategory = getTaskCategory(task);
      if (!taskCategory || !filters.category.includes(taskCategory)) {
        if (DEBUG_FILTERING)
          console.log(
            'Filtering out task:',
            task.id,
            'with category:',
            taskCategory
          );
        return false;
      }
    }

    // Due date filter
    if (
      filters.dueDate.length > 0 &&
      !taskMatchesDueDate(task, filters.dueDate)
    ) {
      if (DEBUG_FILTERING)
        console.log(
          'Filtering out task:',
          task.id,
          'with due date:',
          task.due_date
        );
      return false;
    }

    // Show completed filter
    if (!filters.showCompleted && task.status === 'completed') {
      if (DEBUG_FILTERING)
        console.log(
          'Filtering out task:',
          task.id,
          'with status:',
          task.status
        );
      return false;
    }

    return true;
  });

  // Combine active tasks with filtered other tasks
  const combinedTasks = [...activeTasks, ...filteredOtherTasks];
  if (DEBUG_FILTERING) {
    console.log(
      'Active tasks:',
      activeTasks.length,
      'Filtered other tasks:',
      filteredOtherTasks.length
    );
  }

  return combinedTasks;
}

/**
 * TASK SORTING FUNCTIONS
 */

/**
 * Get the last active time from a task in milliseconds
 */
function getLastActiveTime(task: Task): number {
  // In priority order:
  // 1. last_active_at timestamp if available
  // 2. last_timer_stop timestamp if available
  // 3. updated_at timestamp if available
  // 4. created_at timestamp as fallback

  if (task.last_active_at) {
    return new Date(task.last_active_at).getTime();
  }

  if (task.last_timer_stop) {
    return new Date(task.last_timer_stop).getTime();
  }

  if (task.updated_at) {
    return new Date(task.updated_at).getTime();
  }

  return new Date(task.created_at).getTime();
}

/**
 * Sort tasks based on sort criteria
 */
export function sortTasks(
  tasks: Task[],
  sortBy: TaskFilter['sortBy'],
  sortOrder: 'asc' | 'desc'
): Task[] {
  const sortedTasks = [...tasks];

  const priorityRank = { urgent: 4, high: 3, medium: 2, low: 1 };
  const statusRank = { active: 4, in_progress: 3, pending: 2, completed: 1 };

  sortedTasks.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'priority': {
        const rankA =
          priorityRank[a.priority as keyof typeof priorityRank] || 0;
        const rankB =
          priorityRank[b.priority as keyof typeof priorityRank] || 0;
        comparison = rankA - rankB;
        break;
      }
      case 'dueDate': {
        const dateA = a.due_date
          ? new Date(a.due_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const dateB = b.due_date
          ? new Date(b.due_date).getTime()
          : Number.MAX_SAFE_INTEGER;
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
      case 'lastActive': {
        // Active tasks always come first when sorting by lastActive
        if (a.status === 'active' && b.status !== 'active') {
          comparison = -1;
        } else if (a.status !== 'active' && b.status === 'active') {
          comparison = 1;
        } else {
          // If both tasks have the same status (both active or both not active)
          // Then sort by the most recent activity
          const timeA = getLastActiveTime(a);
          const timeB = getLastActiveTime(b);
          comparison = timeA - timeB;
        }
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
export function filterAndSortTasks(
  tasks: Task[],
  filters: TaskFilter,
  searchQuery: string = ''
): Task[] {
  const filteredTasks = filterTasks(tasks, filters, searchQuery);
  return sortTasks(filteredTasks, filters.sortBy, filters.sortOrder);
}

/**
 * STYLING HELPER FUNCTIONS
 */

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

/**
 * TIME FORMATTING FUNCTIONS
 */

/**
 * Parse a time string to total minutes
 */
function parseTimeToMinutes(timeString: string): number {
  // Check if it's in HH:MM:SS format
  const timeRegex = /^(\d+):(\d+):(\d+)$/;
  const timeMatch = timeString.match(timeRegex);

  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    return hours * 60 + minutes;
  }

  // Check for 'X minutes' format
  const minutesOnly = /^(\d+)\s+minutes?$/i;
  const minutesMatch = timeString.match(minutesOnly);

  if (minutesMatch) {
    return parseInt(minutesMatch[1]);
  }

  // Try to handle 'X hours Y minutes' format
  const hoursAndMinutes = /(\d+)\s+hours?(?:\s+(\d+)\s+minutes?)?/i;
  const complexMatch = timeString.match(hoursAndMinutes);

  if (complexMatch) {
    const hours = parseInt(complexMatch[1] || '0');
    const minutes = parseInt(complexMatch[2] || '0');
    return hours * 60 + minutes;
  }

  return 0; // Default if unparseable
}

/**
 * Format time string to a consistent format
 */
export function formatTimeString(
  timeString: string | null,
  shortFormat: boolean = false
): string | null {
  if (!timeString) return null;

  const totalMinutes = parseTimeToMinutes(timeString);

  if (totalMinutes === 0) return shortFormat ? '0m' : 'Quick';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (shortFormat) {
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  } else {
    if (hours > 0 && minutes > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${
        minutes > 1 ? 's' : ''
      }`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }
}

/**
 * Parse and format estimated time from PostgreSQL interval format
 * Formats like: '2h 30m', '45m', etc.
 */
export function formatEstimatedTime(
  estimatedTime: string | null
): string | null {
  return formatTimeString(estimatedTime, true);
}

/**
 * Get an appropriate class based on estimated time length
 */
export function getEstimatedTimeClass(estimatedTime: string | null): string {
  if (!estimatedTime) return 'text-gray-400';

  const totalMinutes = parseTimeToMinutes(estimatedTime);

  // Return appropriate color class based on task length
  if (totalMinutes <= 15) {
    return 'text-green-500 font-normal'; // Quick tasks
  } else if (totalMinutes <= 60) {
    return 'text-blue-500 font-normal'; // Medium tasks
  } else if (totalMinutes <= 180) {
    return 'text-amber-500 font-medium'; // Longer tasks
  } else {
    return 'text-red-500 font-medium'; // Very long tasks
  }
}

/**
 * Get appropriate styling for due date based on how soon it is
 * @param dueDate - The due date as a string
 * @returns Object with className and text styling
 */
export function getDueDateStyling(dueDate: string | null): {
  className: string;
  urgencyText: string;
} {
  if (!dueDate) {
    return {
      className: 'text-gray-400',
      urgencyText: '',
    };
  }

  const now = new Date();
  const dueDateTime = new Date(dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Calculate days until due
  const daysUntilDue = Math.ceil(
    (dueDateTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Overdue
  if (dueDateTime < today) {
    return {
      className: 'text-red-600 font-semibold',
      urgencyText: 'Overdue',
    };
  }

  // Due today
  if (dueDateTime.toDateString() === today.toDateString()) {
    return {
      className: 'text-orange-600 font-semibold',
      urgencyText: 'Today',
    };
  }

  // Due tomorrow
  if (dueDateTime.toDateString() === tomorrow.toDateString()) {
    return {
      className: 'text-amber-600',
      urgencyText: 'Tomorrow',
    };
  }

  // Due within a week
  if (daysUntilDue <= 7) {
    return {
      className: 'text-blue-600',
      urgencyText: `${daysUntilDue} days`,
    };
  }

  // Due in more than a week
  return {
    className: 'text-green-600',
    urgencyText: '',
  };
}
