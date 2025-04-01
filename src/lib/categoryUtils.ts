/**
 * Utility functions for task categories
 */

import { Task } from '../types/task';

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
  },
  other: {
    border: "border-l-gray-500",
    background: "bg-gray-100",
    text: "text-gray-800"
  }
};

// Default colors if no category or category not found
export const DEFAULT_CATEGORY_COLORS = {
  border: "border-l-gray-500",
  background: "bg-gray-100",
  text: "text-gray-800"
};

/**
 * Get the category for a task, handling both string and numeric values
 */
export function getTaskCategory(task: Task): string | null {
  // First try category_name (string value)
  if (task.category_name) {
    return task.category_name;
  }
  
  // For backward compatibility, check older formats
  if (typeof task.category === 'string') {
    return task.category;
  }
  
  // Then try numeric category value (legacy)
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
 * Get the category info for a task, prioritizing the categoryId if available
 */
export function getTaskCategoryInfo(task: Task, userCategories: any[] = []): { id: string | null, name: string | null } {
  const categoryName = getTaskCategory(task);
  
  // If we have a category_id, try to find it in user categories
  if (task.category_id && userCategories.length > 0) {
    const category = userCategories.find(c => c.id === task.category_id);
    if (category) {
      return { id: category.id, name: category.name };
    }
  }
  
  // Otherwise just return the category name
  return { id: task.category_id || null, name: categoryName };
}

/**
 * Get category color style based on category name or id
 */
export function getCategoryColorStyle(categoryName: string | null, categoryId: string | null, userCategories: any[] = []) {
  // First check if it's a custom category with a color
  if (categoryId && userCategories.length > 0) {
    const category = userCategories.find(c => c.id === categoryId);
    if (category && category.color) {
      // Return custom color styles based on the category's color
      return {
        border: `border-l-[${category.color}]`,
        background: `bg-opacity-10 bg-[${category.color}]`,
        text: `text-[${category.color}]`
      };
    }
  }
  
  // Then check built-in categories
  if (categoryName && categoryName in CATEGORY_COLORS) {
    return CATEGORY_COLORS[categoryName as keyof typeof CATEGORY_COLORS];
  }
  
  // Default if no category or not found
  return DEFAULT_CATEGORY_COLORS;
}

/**
 * Get the border color class for a task's category
 */
export function getCategoryBorderColor(task: Task, userCategories: any[] = []): string {
  const { name, id } = getTaskCategoryInfo(task, userCategories);
  const categoryColorStyle = getCategoryColorStyle(name, id, userCategories);
  
  return categoryColorStyle.border;
}

/**
 * Get the background color class for a task's category
 */
export function getCategoryBgColor(task: Task, userCategories: any[] = []): string {
  const { name, id } = getTaskCategoryInfo(task, userCategories);
  const categoryColorStyle = getCategoryColorStyle(name, id, userCategories);
  
  return categoryColorStyle.background;
}

/**
 * Get the text color class for a task's category
 */
export function getCategoryTextColor(task: Task, userCategories: any[] = []): string {
  const { name, id } = getTaskCategoryInfo(task, userCategories);
  const categoryColorStyle = getCategoryColorStyle(name, id, userCategories);
  
  return categoryColorStyle.text;
}
