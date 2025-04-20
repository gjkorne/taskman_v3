import { Task, TaskStatusType } from '../types/task';
import {
  TaskCreateDTO,
  TaskUpdateDTO,
  taskRepository,
} from '../repositories/taskRepository';
import { ITaskService, TaskServiceEvents } from './interfaces/ITaskService';
import { BaseService, ServiceError } from './BaseService';
import { supabase } from '../lib/supabase';

/**
 * Improved TaskService that uses the repository pattern
 *
 * This service contains business logic for task operations while
 * delegating data access to the repository layer.
 * Extends BaseService for standardized error handling and event management.
 */
export class TaskService
  extends BaseService<TaskServiceEvents>
  implements ITaskService
{
  private refreshInProgress = false;
  private syncInProgress = false;

  constructor() {
    super();
    this.markReady();
  }

  /**
   * Get all tasks for the current user
   */
  async getTasks(): Promise<Task[]> {
    try {
      console.log('TaskService: Getting all tasks from repository');
      // Ensure we're initializing the repository properly
      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      const tasks = await taskRepository.getAll();
      console.log('TaskService: Successfully retrieved tasks:', tasks.length);

      this.emit('tasks-loaded', tasks);
      return tasks;
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.get_tasks_error'
      );
      this.emit('error', serviceError);
      return [];
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      const task = await taskRepository.getById(id);
      return task;
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.get_task_by_id_error'
      );
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: TaskCreateDTO): Promise<Task | null> {
    try {
      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      // Get current user ID from Supabase session
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Ensure created_by field is set to current user ID
      const taskWithUserId: TaskCreateDTO = {
        ...taskData,
        created_by: userId,
      };

      const task = await taskRepository.create(taskWithUserId);

      // Emit event
      this.emit('task-created', task);
      this.emit('tasks-changed');

      return task;
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.create_task_error'
      );
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, taskData: TaskUpdateDTO): Promise<Task | null> {
    try {
      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      const task = await taskRepository.update(id, taskData);

      // Emit event
      this.emit('task-updated', task);
      this.emit('tasks-changed');

      return task;
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.update_task_error'
      );
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      const success = await taskRepository.delete(id);

      if (success) {
        // Emit event
        this.emit('task-deleted', id);
        this.emit('tasks-changed');
      }

      return success;
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.delete_task_error'
      );
      this.emit('error', serviceError);
      return false;
    }
  }

  /**
   * Update a task's status
   */
  async updateTaskStatus(
    id: string,
    status: TaskStatusType
  ): Promise<Task | null> {
    try {
      return await this.updateTask(id, { status });
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.update_status_error'
      );
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Start a task (change status to ACTIVE)
   */
  async startTask(id: string): Promise<Task | null> {
    try {
      return await this.updateTaskStatus(id, 'active');
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.start_task_error'
      );
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Complete a task (change status to COMPLETED)
   */
  async completeTask(id: string): Promise<Task | null> {
    try {
      return await this.updateTaskStatus(id, 'completed');
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.complete_task_error'
      );
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Pause a task (change status to PAUSED)
   */
  async pauseTask(id: string): Promise<Task | null> {
    try {
      return await this.updateTaskStatus(id, 'paused');
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.pause_task_error'
      );
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Refresh all tasks from the data source
   */
  async refreshTasks(): Promise<Task[]> {
    if (this.refreshInProgress) {
      console.log('TaskService: Refresh already in progress, skipping');
      return [];
    }

    try {
      this.refreshInProgress = true;

      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      const tasks = await taskRepository.getAll();

      this.emit('tasks-loaded', tasks);
      return tasks;
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.refresh_tasks_error'
      );
      this.emit('error', serviceError);
      return [];
    } finally {
      this.refreshInProgress = false;
    }
  }

  /**
   * Force refresh from remote storage
   */
  async forceRefresh(): Promise<void> {
    try {
      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      await taskRepository.forceRefresh();

      // Refresh task list after force refresh
      const tasks = await this.getTasks();
      this.emit('tasks-loaded', tasks);
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.force_refresh_error'
      );
      this.emit('error', serviceError);
    }
  }

  /**
   * Check if there are unsynchronized changes
   */
  async hasUnsyncedChanges(): Promise<boolean> {
    try {
      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      return await taskRepository.hasPendingChanges();
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.check_unsynced_error'
      );
      this.emit('error', serviceError);
      return false;
    }
  }

  /**
   * Synchronize local data with remote storage
   */
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('TaskService: Sync already in progress, skipping');
      return;
    }

    try {
      this.syncInProgress = true;

      if (!taskRepository) {
        throw new Error('Task repository is not initialized');
      }

      // Start the sync process
      await taskRepository.sync();

      // Refresh the task list after sync
      const tasks = await this.refreshTasks();
      this.emit('tasks-loaded', tasks);
    } catch (error) {
      const serviceError: ServiceError = this.processError(
        error,
        'task_service.sync_error'
      );
      this.emit('error', serviceError);
    } finally {
      this.syncInProgress = false;
    }
  }
}

// Export a singleton instance
export const taskService = new TaskService();
