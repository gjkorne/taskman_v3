import { Task, TaskStatus } from '../types/task';
import { TaskCreateDTO, TaskUpdateDTO, taskRepository } from '../repositories/taskRepository';
import { EventEmitter } from '../utils/eventEmitter';

/**
 * Improved TaskService that uses the repository pattern
 * 
 * This service contains business logic for task operations while
 * delegating data access to the repository layer.
 */
export class TaskService {
  private taskEvents = new EventEmitter<{
    'task-created': Task;
    'task-updated': Task;
    'task-deleted': string;
    'tasks-changed': void;
    'tasks-loaded': Task[];
    'error': Error;
  }>();

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
   * Complete a task
   */
  async completeTask(id: string): Promise<Task | null> {
    return this.updateTaskStatus(id, TaskStatus.COMPLETED);
  }

  /**
   * Start a task (set to active)
   */
  async startTask(id: string): Promise<Task | null> {
    return this.updateTaskStatus(id, TaskStatus.ACTIVE);
  }

  /**
   * Archive a task
   */
  async archiveTask(id: string): Promise<Task | null> {
    return this.updateTaskStatus(id, TaskStatus.ARCHIVED);
  }

  /**
   * Sync tasks with the server
   */
  async syncTasks(): Promise<void> {
    try {
      await taskRepository.sync();
      // Refresh local tasks after sync
      const tasks = await taskRepository.getAll();
      this.taskEvents.emit('tasks-loaded', tasks);
      this.taskEvents.emit('tasks-changed');
    } catch (error) {
      this.handleError('Error syncing tasks', error);
    }
  }

  /**
   * Check if there are unsynchronized changes
   */
  async hasUnsyncedChanges(): Promise<boolean> {
    try {
      return await taskRepository.hasPendingChanges();
    } catch (error) {
      this.handleError('Error checking for unsynced changes', error);
      return false;
    }
  }

  /**
   * Force a refresh from the server
   */
  async forceRefresh(): Promise<void> {
    try {
      await taskRepository.forceRefresh();
      const tasks = await taskRepository.getAll();
      this.taskEvents.emit('tasks-loaded', tasks);
      this.taskEvents.emit('tasks-changed');
    } catch (error) {
      this.handleError('Error force refreshing tasks', error);
    }
  }

  /**
   * Subscribe to task events
   */
  on<K extends keyof typeof this.taskEvents.events>(
    event: K,
    handler: (data: typeof this.taskEvents.events[K]) => void
  ): () => void {
    return this.taskEvents.on(event, handler);
  }

  /**
   * Handle and log errors
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.taskEvents.emit('error', new Error(`${message}: ${error.message || error}`));
  }
}

// Export a singleton instance
export const taskService = new TaskService();
