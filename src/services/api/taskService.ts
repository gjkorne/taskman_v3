import { supabase } from '../../lib/supabase';
import {
  TaskSubmitData,
  TaskDatabaseRow,
  VALID_STATUSES,
  VALID_PRIORITIES,
} from '../../components/TaskForm/schema';
import { Task } from '../../types/task';

// Debug flag for task service operations - set to true to enable debugging
const isDevelopment = process.env.NODE_ENV !== 'production';
const DEBUG_TASK_SERVICE = isDevelopment && false; // Set to true to enable debugging

// Define the interface for the Task service
export interface ITaskService {
  // Task CRUD operations
  getTasks(): Promise<{ data: Task[] | null; error: Error | null }>;
  getTaskById(id: string): Promise<{ data: Task | null; error: Error | null }>;
  createTask(
    taskData: TaskSubmitData
  ): Promise<{ data: Task | null; error: Error | null }>;
  updateTask(
    id: string,
    taskData: Partial<TaskSubmitData>
  ): Promise<{ data: Task | null; error: Error | null }>;
  deleteTask(id: string): Promise<{ error: Error | null }>;

  // Task status operations
  updateTaskStatus(
    id: string,
    status: string
  ): Promise<{ error: Error | null }>;

  // Batch operations
  batchDeleteTasks(ids: string[]): Promise<{ error: Error | null }>;
}

// Implementation of the Task service using Supabase
export class TaskService implements ITaskService {
  // Helper method to check if user is authenticated
  private async ensureAuthenticated(): Promise<string> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be logged in to perform this action');
    }
    return session.user.id;
  }

  /**
   * Map UI form data to database field names (camelCase to snake_case)
   * This handles the differences between the UI form and database schema
   */
  private formatTaskForDatabase(taskData: TaskSubmitData): Record<string, any> {
    // Start with fields that match DB schema exactly
    const formattedData: Record<string, any> = {
      title: taskData.title,
      description: taskData.description || '',
      status: this.validateStatus(taskData.status || 'pending'),
      priority: this.validatePriority(taskData.priority || 'medium'),
      tags: taskData.tags || [],
    };

    // Map UI fields to database column names
    if (taskData.category !== undefined) {
      formattedData.category_name = taskData.category;
    }

    if (taskData.isDeleted !== undefined) {
      formattedData.is_deleted = taskData.isDeleted;
    } else {
      // Default to false if not specified
      formattedData.is_deleted = false;
    }

    if (taskData.listId !== undefined) {
      formattedData.list_id = taskData.listId;
    }

    // Handle due date (UI -> DB)
    if (taskData.hasDueDate && taskData.dueDate) {
      formattedData.due_date = taskData.dueDate;
    } else if (!taskData.hasDueDate) {
      formattedData.due_date = null;
    }

    // Format estimated time as PostgreSQL interval
    if (taskData.estimatedTime) {
      const minutes = parseInt(taskData.estimatedTime, 10);
      if (!isNaN(minutes)) {
        // Format correctly as "X minutes" for PostgreSQL
        // This prevents the conversion issues (e.g., 30 min becoming 4166h)
        formattedData.estimated_time = `${minutes} minutes`;
      }
    } else {
      // Make sure to explicitly set to null if not provided
      formattedData.estimated_time = null;
    }

    // Add any NLP-related data
    if (taskData.rawInput) {
      formattedData.raw_input = taskData.rawInput;
    }

    if (DEBUG_TASK_SERVICE) {
      console.log('Formatted task data for database:', formattedData);
    }

    return formattedData;
  }

  /**
   * Map database row to UI-friendly format (snake_case to camelCase)
   * This handles differences between database schema and UI expectations
   */
  private formatTaskForUI(dbTask: TaskDatabaseRow): Task {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || '',
      status: dbTask.status,
      priority: dbTask.priority,
      due_date: dbTask.due_date,
      estimated_time: dbTask.estimated_time,
      actual_time: dbTask.actual_time,
      tags: dbTask.tags || [],
      created_at: dbTask.created_at,
      updated_at: dbTask.updated_at,
      created_by: dbTask.created_by,
      is_deleted: dbTask.is_deleted || false,
      category_name: dbTask.category_name,
      // Additional fields can be mapped here as needed
    } as Task;
  }

  /**
   * Validate task status against allowed values
   */
  private validateStatus(status: string): string {
    // Check if status is valid
    if ((VALID_STATUSES as readonly string[]).includes(status)) {
      return status;
    }
    // Default to pending if invalid
    return 'pending';
  }

  /**
   * Validate task priority against allowed values
   */
  private validatePriority(priority: string): string {
    // Check if priority is valid
    if ((VALID_PRIORITIES as readonly string[]).includes(priority)) {
      return priority;
    }
    // Default to medium if invalid
    return 'medium';
  }

  /**
   * Get all tasks for the current user
   */
  async getTasks(): Promise<{ data: Task[] | null; error: Error | null }> {
    try {
      const userId = await this.ensureAuthenticated();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map each DB row to UI-friendly format
      const formattedTasks =
        data?.map((task) => this.formatTaskForUI(task as TaskDatabaseRow)) ||
        null;

      return { data: formattedTasks, error: null };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(
    id: string
  ): Promise<{ data: Task | null; error: Error | null }> {
    try {
      await this.ensureAuthenticated();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Format the task for UI if it exists
      const formattedTask = data
        ? this.formatTaskForUI(data as TaskDatabaseRow)
        : null;

      return { data: formattedTask, error: null };
    } catch (error) {
      console.error('Error fetching task:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new task
   */
  async createTask(
    taskData: TaskSubmitData
  ): Promise<{ data: Task | null; error: Error | null }> {
    try {
      const userId = await this.ensureAuthenticated();

      // Log task data before processing
      if (DEBUG_TASK_SERVICE) {
        console.log('Creating task with data:', taskData);
        console.log('Category value being submitted:', taskData.category);
      }

      const formattedData = this.formatTaskForDatabase(taskData);
      formattedData.created_by = userId;

      // Log formatted data before sending to database
      if (DEBUG_TASK_SERVICE) {
        console.log('Formatted task data before insert:', formattedData);
        console.log('Category name in DB format:', formattedData.category_name);
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([formattedData])
        .select()
        .single();

      if (error) throw error;

      // Format the created task for UI
      const formattedTask = data
        ? this.formatTaskForUI(data as TaskDatabaseRow)
        : null;

      // Log the task returned from the database
      if (DEBUG_TASK_SERVICE && formattedTask) {
        console.log('Created task with data:', formattedTask);
        console.log('Category in returned task:', formattedTask.category_name);
      }

      return { data: formattedTask, error: null };
    } catch (error) {
      console.error('Error creating task:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(
    id: string,
    taskData: Partial<TaskSubmitData>
  ): Promise<{ data: Task | null; error: Error | null }> {
    try {
      await this.ensureAuthenticated();

      const formattedData = this.formatTaskForDatabase(
        taskData as TaskSubmitData
      );

      const { data, error } = await supabase
        .from('tasks')
        .update(formattedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Format the updated task for UI
      const formattedTask = data
        ? this.formatTaskForUI(data as TaskDatabaseRow)
        : null;

      return { data: formattedTask, error: null };
    } catch (error) {
      console.error('Error updating task:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a task (soft delete by setting is_deleted to true)
   */
  async deleteTask(id: string): Promise<{ error: Error | null }> {
    try {
      await this.ensureAuthenticated();

      const { error } = await supabase
        .from('tasks')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { error: error as Error };
    }
  }

  /**
   * Update the status of a task
   */
  async updateTaskStatus(
    id: string,
    status: string
  ): Promise<{ error: Error | null }> {
    try {
      await this.ensureAuthenticated();

      // Validate the status before sending to database
      const validatedStatus = this.validateStatus(status);

      const { error } = await supabase
        .from('tasks')
        .update({ status: validatedStatus })
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error updating task status:', error);
      return { error: error as Error };
    }
  }

  /**
   * Batch delete multiple tasks
   */
  async batchDeleteTasks(ids: string[]): Promise<{ error: Error | null }> {
    try {
      await this.ensureAuthenticated();

      const { error } = await supabase
        .from('tasks')
        .update({ is_deleted: true })
        .in('id', ids);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error batch deleting tasks:', error);
      return { error: error as Error };
    }
  }
}

// Create and export a singleton instance
export const taskService = new TaskService();
