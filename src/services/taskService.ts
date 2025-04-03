import { Task, TaskStatus } from '../types/task';
import { TaskCreateDTO, TaskUpdateDTO, taskRepository } from '../repositories/taskRepository';
import { EventEmitter } from '../utils/eventEmitter';
import { ITaskService, TaskServiceEvents } from './interfaces/ITaskService';

/**
 * Improved TaskService that uses the repository pattern
 * 
 * This service contains business logic for task operations while
 * delegating data access to the repository layer.
 */
export class TaskService implements ITaskService {
  private taskEvents = new EventEmitter<TaskServiceEvents>();
  private lastError: Error | null = null;
  private refreshInProgress = false;
  private syncInProgress = false;

  /**
   * Get all tasks for the current user
   */
  async getTasks(): Promise<Task[]> {
    try {
      console.log('TaskService: Getting all tasks from repository');
      // Ensure we're initializing the repository properly
      if (!taskRepository) {
        console.error('TaskService: taskRepository is not initialized!');
        throw new Error('Task repository is not initialized');
      }
      
      const tasks = await taskRepository.getAll();
      console.log('TaskService: Successfully retrieved tasks:', tasks.length);
      
      // Emit the tasks-loaded event with the tasks array
      this.taskEvents.emit('tasks-loaded', tasks);
      return tasks;
    } catch (error) {
      console.error('TaskService: Error fetching tasks:', error);
      this.handleError('Error fetching tasks', error);
      return [];
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      return await taskRepository.getById(id);
    } catch (error) {
      this.handleError(`Error fetching task ${id}`, error);
      return null;
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: TaskCreateDTO): Promise<Task | null> {
    try {
      const task = await taskRepository.create(taskData);
      this.taskEvents.emit('task-created', task);
      this.taskEvents.emit('tasks-changed');
      return task;
    } catch (error) {
      this.handleError('Error creating task', error);
      return null;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, taskData: TaskUpdateDTO): Promise<Task | null> {
    try {
      const task = await taskRepository.update(id, taskData);
      this.taskEvents.emit('task-updated', task);
      this.taskEvents.emit('tasks-changed');
      return task;
    } catch (error) {
      this.handleError(`Error updating task ${id}`, error);
      return null;
    }
  }

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      const success = await taskRepository.delete(id);
      if (success) {
        this.taskEvents.emit('task-deleted', id);
        this.taskEvents.emit('tasks-changed');
      }
      return success;
    } catch (error) {
      this.handleError(`Error deleting task ${id}`, error);
      return false;
    }
  }

  /**
   * Update a task's status
   */
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task | null> {
    try {
      console.log(`TaskService: Updating task ${id} status to ${status}`);
      const task = await taskRepository.updateStatus(id, status);
      
      if (task) {
        this.taskEvents.emit('task-updated', task);
        this.taskEvents.emit('tasks-changed');
      }
      
      return task;
    } catch (error) {
      this.handleError(`Error updating task status for ${id}`, error);
      return null;
    }
  }

  /**
   * Start a task (set status to ACTIVE)
   */
  async startTask(id: string): Promise<Task | null> {
    return this.updateTaskStatus(id, TaskStatus.ACTIVE);
  }

  /**
   * Complete a task (set status to COMPLETED)
   */
  async completeTask(id: string): Promise<Task | null> {
    return this.updateTaskStatus(id, TaskStatus.COMPLETED);
  }

  /**
   * Force refresh tasks from the remote source
   */
  async refreshTasks(): Promise<Task[]> {
    if (this.refreshInProgress) {
      console.warn('TaskService: Refresh already in progress');
      return [];
    }
    
    this.refreshInProgress = true;
    
    try {
      await taskRepository.forceRefresh();
      const tasks = await this.getTasks();
      return tasks;
    } catch (error) {
      this.handleError('Error refreshing tasks', error);
      return [];
    } finally {
      this.refreshInProgress = false;
    }
  }

  /**
   * Check if there are any pending changes that need to be synced
   */
  async hasUnsyncedChanges(): Promise<boolean> {
    try {
      return await taskRepository.hasPendingChanges();
    } catch (error) {
      console.error('Error checking for unsynced changes:', error);
      return false;
    }
  }

  /**
   * Sync tasks between local and remote storage
   */
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      console.warn('TaskService: Sync already in progress');
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      await taskRepository.sync();
      // Refresh task list after sync
      await this.getTasks();
    } catch (error) {
      this.handleError('Error syncing tasks', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Force refresh from remote storage
   */
  async forceRefresh(): Promise<void> {
    try {
      await taskRepository.forceRefresh();
      // Refresh tasks after the force refresh
      await this.getTasks();
    } catch (error) {
      this.handleError('Error refreshing tasks from remote', error);
    }
  }

  /**
   * Get the latest error for telemetry/logging purposes
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Standard error handling for all service methods
   */
  private handleError(message: string, error: any): void {
    console.error(`TaskService: ${message}`, error);
    
    // Create a standardized error object
    const errorObj = error instanceof Error ? error : new Error(`${message}: ${JSON.stringify(error)}`);
    
    // Store the last error for debugging/telemetry
    this.lastError = errorObj;
    
    // Emit the error event
    this.taskEvents.emit('error', errorObj);
  }

  /**
   * Subscribe to task events
   */
  on<K extends keyof TaskServiceEvents>(
    event: K, 
    callback: (data: TaskServiceEvents[K]) => void
  ): () => void {
    return this.taskEvents.on(event, callback);
  }

  /**
   * Unsubscribe from task events
   */
  off<K extends keyof TaskServiceEvents>(
    event: K, 
    callback: (data: TaskServiceEvents[K]) => void
  ): void {
    this.taskEvents.off(event, callback);
  }

  /**
   * Emit a task event
   */
  emit<K extends keyof TaskServiceEvents>(
    event: K, 
    data?: TaskServiceEvents[K]
  ): void {
    this.taskEvents.emit(event, data);
  }
}

// Export a singleton instance
export const taskService = new TaskService();
