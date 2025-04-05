// MockFactory.ts
// Utility for generating consistent test data across all test files

import { Task, TaskPriority, TaskStatus } from '../types/task';

// Inline type definitions to avoid module resolution issues
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export class MockFactory {
  // Generate a mock task with customizable properties
  static createTask(overrides: Partial<Task> = {}): Task {
    const id = overrides.id || `task-${Math.floor(Math.random() * 1000)}`;
    
    return {
      id,
      title: overrides.title || `Task ${id}`,
      description: overrides.description || `Description for task ${id}`,
      priority: overrides.priority || TaskPriority.MEDIUM,
      status: overrides.status || TaskStatus.ACTIVE,
      due_date: overrides.due_date || new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      created_at: overrides.created_at || new Date().toISOString(),
      updated_at: overrides.updated_at || new Date().toISOString(),
      list_id: overrides.list_id || null,
      category_name: overrides.category_name || 'Work',
      created_by: overrides.created_by || 'user-1',
      tags: overrides.tags || [],
      is_deleted: overrides.is_deleted || false,
      estimated_time: overrides.estimated_time || null,
      actual_time: overrides.actual_time || null,
      notes: overrides.notes || null,
      checklist_items: overrides.checklist_items || null,
      note_type: overrides.note_type || null,
      ...overrides
    };
  }

  // Generate multiple mock tasks
  static createTasks(count: number, baseOverrides: Partial<Task> = {}): Task[] {
    return Array.from({ length: count }, (_, index) => {
      const priority = index % 3 === 0 
        ? TaskPriority.HIGH 
        : (index % 3 === 1 ? TaskPriority.MEDIUM : TaskPriority.LOW);
      
      const status = index % 4 === 0 
        ? TaskStatus.COMPLETED 
        : (index % 4 === 1 ? TaskStatus.IN_PROGRESS : TaskStatus.ACTIVE);
      
      const category = index % 2 === 0 ? 'Work' : 'Personal';
      
      const daysToAdd = index * 2;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      
      return this.createTask({
        id: `task-${index + 1}`,
        title: `Task ${index + 1}`,
        priority,
        status,
        category_name: category,
        due_date: dueDate.toISOString().split('T')[0],
        created_by: index % 3 === 0 ? 'user-1' : 'user-2',
        ...baseOverrides
      });
    });
  }

  // Generate a mock user
  static createUser(overrides: Partial<User> = {}): User {
    const id = overrides.id || `user-${Math.floor(Math.random() * 1000)}`;
    
    return {
      id,
      name: overrides.name || `User ${id}`,
      email: overrides.email || `user${id}@example.com`,
      avatar_url: overrides.avatar_url || null,
      ...overrides
    };
  }

  // Generate a mock category
  static createCategory(overrides: Partial<Category> = {}): Category {
    const id = overrides.id || `category-${Math.floor(Math.random() * 1000)}`;
    
    return {
      id,
      name: overrides.name || `Category ${id}`,
      color: overrides.color || '#' + Math.floor(Math.random() * 16777215).toString(16),
      user_id: overrides.user_id || 'user-1',
      ...overrides
    };
  }
  
  // Generate a mock filter criteria
  static createFilterCriteria(field: string, operator: string, value: any) {
    return { field, operator, value };
  }
  
  // Generate a mock sort criteria
  static createSortCriteria(field: string, direction: 'asc' | 'desc' = 'asc') {
    return { field, direction };
  }
  
  // Generate a mock group criteria
  static createGroupCriteria(field: string) {
    return { field };
  }
  
  // Generate test scenarios for filtering/sorting
  static createFilterSortTestScenario() {
    const tasks = this.createTasks(10);
    
    const priorityFilters = [
      this.createFilterCriteria('priority', 'eq', TaskPriority.HIGH)
    ];
    
    const statusFilters = [
      this.createFilterCriteria('status', 'in', [TaskStatus.ACTIVE, TaskStatus.IN_PROGRESS])
    ];
    
    const dueDateSort = this.createSortCriteria('due_date', 'asc');
    const prioritySort = this.createSortCriteria('priority', 'desc');
    
    const categoryGroup = this.createGroupCriteria('category_name');
    
    return {
      tasks,
      filters: {
        priority: priorityFilters,
        status: statusFilters
      },
      sorts: {
        dueDate: dueDateSort,
        priority: prioritySort
      },
      groups: {
        category: categoryGroup
      }
    };
  }
}
