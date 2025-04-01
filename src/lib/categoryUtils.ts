/**
 * Utility functions for task categories
 */

import { Task } from '../components/TaskList/TaskCard';

// Category color styles
export const CATEGORY_COLORS = {
  work: {
    border: "border-l-green-500",
    background: "bg-green-100",
    text: "text-green-800"
  },
  personal: {
    border: "border-l-blue-500",
    background: "bg-blue-100",
    text: "text-blue-800"
  },
  childcare: {
    border: "border-l-cyan-500",
    background: "bg-cyan-100",
    text: "text-cyan-800"
  }
};

/**
 * Get the category for a task, handling both string and numeric values
 */
export function getTaskCategory(task: Task): string | null {
  // First try category_name (string value from migration)
  if (task.category_name) {
    return task.category_name;
  }
  
  // Then try string category value
  if (typeof task.category === 'string') {
    return task.category;
  }
  
  // Then try numeric category value
  if (typeof task.category === 'number') {
    switch (task.category) {
      case 1: return 'work';
      case 2: return 'personal';
      case 3: return 'childcare';
      default: return null;
    }
  }
  
  return null;
}

/**
 * Get the border color class for a task's category
 */
export function getCategoryBorderColor(task: Task): string {
  const category = getTaskCategory(task);
  
  if (category && CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]) {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS].border;
  }
  
  // If no category is found, generate one based on task ID
  const taskIdNum = parseInt(task.id.replace(/-/g, '').substring(0, 8), 16);
  const categoryIndex = taskIdNum % 3;
  
  const categories = ['work', 'personal', 'childcare'] as const;
  const fallbackCategory = categories[categoryIndex];
  
  return CATEGORY_COLORS[fallbackCategory].border;
}

/**
 * Get the background color class for a task's category
 */
export function getCategoryBgColor(task: Task): string {
  const category = getTaskCategory(task);
  
  if (category && CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]) {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS].background;
  }
  
  // If no category is found, generate one based on task ID
  const taskIdNum = parseInt(task.id.replace(/-/g, '').substring(0, 8), 16);
  const categoryIndex = taskIdNum % 3;
  
  const categories = ['work', 'personal', 'childcare'] as const;
  const fallbackCategory = categories[categoryIndex];
  
  return CATEGORY_COLORS[fallbackCategory].background;
}

/**
 * Get the text color class for a task's category
 */
export function getCategoryTextColor(task: Task): string {
  const category = getTaskCategory(task);
  
  if (category && CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]) {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS].text;
  }
  
  // If no category is found, generate one based on task ID
  const taskIdNum = parseInt(task.id.replace(/-/g, '').substring(0, 8), 16);
  const categoryIndex = taskIdNum % 3;
  
  const categories = ['work', 'personal', 'childcare'] as const;
  const fallbackCategory = categories[categoryIndex];
  
  return CATEGORY_COLORS[fallbackCategory].text;
}
