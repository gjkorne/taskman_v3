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
  createTask(
    taskData: TaskFormData
  ): Promise<{ data: Task | null; error: Error | null }>;
  updateTask(
    id: string,
    taskData: Partial<TaskFormData>
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

  // Helper method to format task data for database
  private formatTaskForDatabase(taskData: TaskFormData): Record<string, any> {
    const formattedData: Record<string, any> = {
      title: taskData.title,
      description: taskData.description || '',
      status: this.normalizeStatus(taskData.status || 'pending'),
      priority: taskData.priority || 'medium',
      category_name: taskData.category || null,
      category_id: taskData.categoryId || null,
      tags: taskData.tags || [],
      is_deleted: taskData.isDeleted || false,
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

    // Handle subcategory (saved as a tag)
    if (taskData.subcategory) {
      const subcategoryTag = `subcategory:${taskData.subcategory}`;
      if (!formattedData.tags.includes(subcategoryTag)) {
        formattedData.tags = [...(formattedData.tags || []), subcategoryTag];
      }
    }

    return formattedData;
  }

  /**
   * Normalize status string to ensure consistency
   */
  private normalizeStatus(status: string): string {
    // Detect if the input looks like a UUID (likely a taskId mistakenly passed as status)
    if (
      status &&
      status.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      console.warn(
        `Status parameter appears to be a UUID: "${status}", likely a taskId was mistakenly passed as status. Defaulting to "pending"`
      );
      return 'pending';
    }

    // Convert to lowercase and replace spaces with underscores if needed
    let normalizedStatus = status.toLowerCase().trim();

    // Handle possible variations
    if (
      normalizedStatus === 'in progress' ||
      normalizedStatus === 'in-progress'
    ) {
      return 'paused'; // Convert old 'in_progress' to new 'paused' status
    }

    const validStatuses = [
      'active',
      'paused',
      'completed',
      'archived',
      'pending',
    ];

    if (validStatuses.includes(normalizedStatus)) {
      return normalizedStatus;
    }

    // Default to pending if status is invalid
    console.warn(`Invalid status value: "${status}", defaulting to "pending"`);
    return 'pending';
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

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching task:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new task
   */
  async createTask(
    taskData: TaskFormData
  ): Promise<{ data: Task | null; error: Error | null }> {
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
  async updateTask(
    id: string,
    taskData: Partial<TaskFormData>
  ): Promise<{ data: Task | null; error: Error | null }> {
    try {
      await this.ensureAuthenticated();

      const formattedData = this.formatTaskForDatabase(
        taskData as TaskFormData
      );

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
   * Update a task's status in the database
   */
  async updateTaskStatus(
    taskId: string,
    status: string
  ): Promise<{ error: Error | null }> {
    try {
      await this.ensureAuthenticated();

      // Parameter validation to prevent accidental swapping
      if (!taskId || typeof taskId !== 'string') {
        console.error('Invalid taskId provided to updateTaskStatus:', taskId);
        return { error: new Error('Invalid task ID provided') };
      }

      if (!status || typeof status !== 'string') {
        console.error('Invalid status provided to updateTaskStatus:', status);
        return { error: new Error('Invalid status provided') };
      }

      // IMPORTANT VALIDATION: Detect if parameters might be swapped
      // Check if taskId looks like a status value (e.g., 'active', 'completed')
      // and status looks like a UUID (which it shouldn't)
      if (
        taskId.match(/^(active|pending|paused|completed|archived)$/i) &&
        status.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      ) {
        console.error(
          'CRITICAL ERROR: Parameters definitely swapped in updateTaskStatus.'
        );
        console.error('Received: taskId=', taskId, 'status=', status);
        console.error('Swapping parameters to correct the error');
        // Swap parameters
        [taskId, status] = [status, taskId];
      }

      // Additional validation to catch UUID in status parameter
      if (
        status.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      ) {
        console.error(
          `Status parameter appears to be a UUID: "${status}", likely a taskId was mistakenly passed as status. Fixing to "pending"`
        );
        status = 'pending';
      }

      const normalizedStatus = this.normalizeStatus(status);

      console.log(`Updating task ${taskId} status to ${normalizedStatus}`);

      const { error } = await supabase
        .from('tasks')
        .update({ status: normalizedStatus })
        .eq('id', taskId);

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
  signIn(
    email: string,
    password: string
  ): Promise<{ session: Session | null; error: Error | null }>;
  signUp(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: Error | null }>;
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
  async getSession(): Promise<{
    session: Session | null;
    error: Error | null;
  }> {
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
  async signIn(
    email: string,
    password: string
  ): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
  async signUp(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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
        password,
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
