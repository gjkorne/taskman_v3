import { useMemo } from 'react';
import { useTaskData } from '../../contexts/task';

/**
 * Custom hook that provides task metrics for dashboard displays
 * Takes advantage of our optimized context structure with proper memoization
 */
export function useTaskMetrics() {
  const { tasks } = useTaskData();
  
  // Calculate all metrics in a single pass for better performance
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Initialize metrics
    const metrics = {
      // Task counts by status
      totalTasks: tasks.length,
      activeTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      
      // Time-based metrics
      tasksDueToday: 0,
      tasksDueThisWeek: 0,
      overdueTask: 0,
      
      // Priority metrics
      highPriorityTasks: 0,
      mediumPriorityTasks: 0,
      lowPriorityTasks: 0,
      
      // Category distribution
      categoryCounts: {} as Record<string, number>,
    };
    
    // Iterate over tasks once for efficiency
    tasks.forEach(task => {
      // Skip deleted tasks
      if (task.is_deleted) return;
      
      // Count by status
      switch (task.status) {
        case 'active':
        case 'in_progress':
          metrics.activeTasks++;
          break;
        case 'completed':
          metrics.completedTasks++;
          break;
        case 'pending':
          metrics.pendingTasks++;
          break;
      }
      
      // Count by priority
      switch (task.priority) {
        case 'high':
        case 'urgent':
          metrics.highPriorityTasks++;
          break;
        case 'medium':
          metrics.mediumPriorityTasks++;
          break;
        case 'low':
          metrics.lowPriorityTasks++;
          break;
      }
      
      // Count by due date
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        
        if (dueDate < today) {
          metrics.overdueTask++;
        } else if (dueDate < tomorrow) {
          metrics.tasksDueToday++;
        } else if (dueDate < nextWeek) {
          metrics.tasksDueThisWeek++;
        }
      }
      
      // Count by category
      if (task.category_name) {
        metrics.categoryCounts[task.category_name] = 
          (metrics.categoryCounts[task.category_name] || 0) + 1;
      }
    });
    
    return metrics;
  }, [tasks]);
}

/**
 * Hook for retrieving only tasks due today (for dashboard widget)
 */
export function useTasksDueToday() {
  const { tasks } = useTaskData();
  
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.due_date || task.is_deleted) return false;
      
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [tasks]);
}

/**
 * Hook for retrieving open tasks grouped by project/category
 */
export function useOpenTasksByProject() {
  const { tasks } = useTaskData();
  
  return useMemo(() => {
    const tasksByCategory: Record<string, {
      count: number;
      total: number;
      tasks: typeof tasks;
    }> = {};
    
    // Group tasks by category
    tasks.forEach(task => {
      if (task.is_deleted) return;
      
      const category = task.category_name || 'Uncategorized';
      
      if (!tasksByCategory[category]) {
        tasksByCategory[category] = {
          count: 0,
          total: 0,
          tasks: []
        };
      }
      
      tasksByCategory[category].total++;
      
      if (task.status !== 'completed' && task.status !== 'archived') {
        tasksByCategory[category].count++;
        tasksByCategory[category].tasks.push(task);
      }
    });
    
    // Convert to array for easier rendering
    return Object.entries(tasksByCategory)
      .map(([name, data]) => ({
        name,
        count: data.count,
        total: data.total,
        progress: data.total > 0 ? (data.total - data.count) / data.total : 0,
        tasks: data.tasks
      }))
      .filter(project => project.total > 0)
      .sort((a, b) => b.count - a.count);
  }, [tasks]);
}
