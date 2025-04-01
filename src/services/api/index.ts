// Import services first
import { supabase } from '../../lib/supabase';
import { Task } from '../../types/task';
import { TaskFormData } from '../../components/TaskForm/schema';
import { User, Session } from '@supabase/supabase-js';

/*
 * Task Service
 */

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

/*
 * Auth Service
 */

// Define the interface for the Auth service
export interface IAuthService {
  // Session and user management
  getSession(): Promise<{ session: Session | null; error: Error | null }>;
  getUser(): Promise<{ user: User | null; error: Error | null }>;
  
  // Authentication methods
  signIn(email: string, password: string): Promise<{ session: Session | null; error: Error | null }>;
  signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  
  // Password management
  resetPassword(email: string): Promise<{ error: Error | null }>;
  updatePassword(password: string): Promise<{ error: Error | null }>;
}

// Implementation of the Auth service using Supabase
export class AuthService implements IAuthService {
  /**
   * Get the current session
   */
  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { session: null, error: error as Error };
    }
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error getting user:', error);
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { session: null, error: error as Error };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error as Error };
    }
  }

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: error as Error };
    }
  }

  /**
   * Update the user's password
   */
  async updatePassword(password: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error updating password:', error);
      return { error: error as Error };
    }
  }
}

// Create and export singleton instances
export const taskService = new TaskService();
export const authService = new AuthService();
