/**
 * Debug utility to analyze task statuses and identify filtering issues
 */
import { Task, TaskStatusType } from '../types/task';
import { TaskFilter } from '../components/TaskList/FilterPanel';
import { filterTasks } from '../lib/taskUtils';

export const debugTaskStatuses = (tasks: Task[], filters: TaskFilter, searchQuery: string = '') => {
  console.group('Task Status Debug');
  
  // Count tasks by status
  const statusCounts: Record<string, number> = {};
  tasks.forEach(task => {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
  });
  
  console.log('Total tasks:', tasks.length);
  console.log('Tasks by status:', statusCounts);
  
  // Specifically log in_progress tasks
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  console.log('In Progress tasks:', inProgressTasks.length);
  if (inProgressTasks.length > 0) {
    console.log('In Progress task examples:', inProgressTasks.slice(0, 3).map(t => ({ 
      id: t.id, 
      title: t.title, 
      status: t.status 
    })));
  }
  
  // Apply filtering
  const activeTasks = tasks.filter(task => task.status === 'active');
  const otherTasks = tasks.filter(task => task.status !== 'active');
  
  // Check if status filter is being applied
  if (filters.status.length > 0) {
    console.log('Status filter is active:', filters.status);
    // Check if 'in_progress' is in the filter
    if (filters.status.includes('in_progress')) {
      console.log('in_progress is included in filter');
    } else {
      console.log('in_progress is NOT included in filter');
    }
  } else {
    console.log('No status filter is active');
  }
  
  // Check completed filter
  if (!filters.showCompleted) {
    console.log('Completed tasks are being filtered out');
    const completedTasks = tasks.filter(task => task.status === 'completed');
    console.log('Completed tasks count:', completedTasks.length);
  }
  
  // Apply filtering using the filterTasks function
  const filteredTasks = filterTasks(tasks, filters, searchQuery);
  console.log('Filtered tasks total:', filteredTasks.length);
  
  // Check filtered tasks by status
  const filteredStatusCounts: Record<string, number> = {};
  filteredTasks.forEach(task => {
    filteredStatusCounts[task.status] = (filteredStatusCounts[task.status] || 0) + 1;
  });
  console.log('Filtered tasks by status:', filteredStatusCounts);
  
  // Check specifically for in_progress tasks after filtering
  const filteredInProgressTasks = filteredTasks.filter(task => task.status === 'in_progress');
  console.log('Filtered In Progress tasks:', filteredInProgressTasks.length);
  
  console.groupEnd();
  
  return {
    originalCounts: statusCounts,
    filteredCounts: filteredStatusCounts,
    totalBefore: tasks.length,
    totalAfter: filteredTasks.length,
    inProgressBefore: inProgressTasks.length,
    inProgressAfter: filteredInProgressTasks.length
  };
};

export default debugTaskStatuses;
