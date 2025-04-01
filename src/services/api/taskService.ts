import { supabase } from '../../lib/supabase';
import { TaskFormData } from '../../components/TaskForm/schema';
import { Task } from '../../types/task';

// Define the interface for the Task service
export interface ITaskService {
  // Task CRUD operations
  getTasks(): Promise<{ data: Task[] | null; error: Error | null }>;
  getTaskById(id: string): Promise<{ data: Task | null; error: Error | null }>;
  createTask(taskData: TaskFormData): Promise<{ data: Task | null; error: Error | null }>;
  updateTask(id: string, taskData: Partial<TaskFormData>): Promise<{ data: Task | null; error: Error | null }>;
  deleteTask(id: string): Promise<{ error: Error | null }>;
  
  // Task status operations
  updateTaskStatus(id: string, status: string): Promise<{ error: Error | null }>;
  
  // Batch operations
  batchDeleteTasks(ids: string[]): Promise<{ error: Error | null }>;
}

// Implementation of the Task service using Supabase
export class TaskService implements ITaskService {
  // Helper method to check if user is authenticated
  private async ensureAuthenticated(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be logged in to perform this action');
    }
    return session.user.id;
  }

  // Helper method to format task data for database
  private formatTaskForDatabase(taskData: TaskFormData): Record<string, any> {
    const formattedData: Record<string, any> = {
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      category_name: taskData.category || null,
      tags: taskData.tags || [],
      is_deleted: taskData.isDeleted || false
    };

    // Add due date if provided
    if (taskData.hasDueDate && taskData.dueDate) {
      formattedData.due_date = taskData.dueDate;
    }

    // Format estimated time as PostgreSQL interval if provided
    if (taskData.estimatedTime) {
      const minutes = parseInt(taskData.estimatedTime, 10);
      if (!isNaN(minutes)) {
        formattedData.estimated_time = `${minutes} minutes`;
      }
    }

    // Add any NLP-related data
    if (taskData.rawInput) {
      formattedData.raw_input = taskData.rawInput;
    }

    return formattedData;
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
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(id: string): Promise<{ data: Task | null; error: Error | null }> {
    try {
      await this.ensureAuthenticated();
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching task:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: TaskFormData): Promise<{ data: Task | null; error: Error | null }> {
    try {
      const userId = await this.ensureAuthenticated();
      
      const formattedData = this.formatTaskForDatabase(taskData);
      formattedData.created_by = userId;
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([formattedData])
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating task:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, taskData: Partial<TaskFormData>): Promise<{ data: Task | null; error: Error | null }> {
    try {
      await this.ensureAuthenticated();
      
      const formattedData = this.formatTaskForDatabase(taskData as TaskFormData);
      
      const { data, error } = await supabase
        .from('tasks')
        .update(formattedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
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
  async updateTaskStatus(id: string, status: string): Promise<{ error: Error | null }> {
    try {
      await this.ensureAuthenticated();
      
      const { error } = await supabase
        .from('tasks')
        .update({ status })
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
