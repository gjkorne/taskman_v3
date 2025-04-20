import { Task, TaskStatusType } from '../../types/task';
import {
  TaskCreateDTO,
  TaskUpdateDTO,
} from '../../repositories/taskRepository';
import { IOfflineCapableService } from './IService';
import { ServiceError } from '../BaseService';

/**
 * Event types that can be emitted by the TaskService
 */
export interface TaskServiceEvents {
  'task-created': Task;
  'task-updated': Task;
  'task-deleted': string;
  'tasks-changed': void;
  'tasks-loaded': Task[];
  error: ServiceError;
}

/**
 * Interface for the TaskService
 * Extends IOfflineCapableService to provide offline capabilities
 */
export interface ITaskService
  extends IOfflineCapableService<TaskServiceEvents> {
  /**
   * Get all tasks for the current user
   */
  getTasks(): Promise<Task[]>;

  /**
   * Get a specific task by ID
   */
  getTaskById(id: string): Promise<Task | null>;

  /**
   * Create a new task
   */
  createTask(taskData: TaskCreateDTO): Promise<Task | null>;

  /**
   * Update an existing task
   */
  updateTask(id: string, taskData: TaskUpdateDTO): Promise<Task | null>;

  /**
   * Delete a task (soft delete)
   */
  deleteTask(id: string): Promise<boolean>;

  /**
   * Update a task's status
   */
  updateTaskStatus(id: string, status: TaskStatusType): Promise<Task | null>;

  /**
   * Refresh all tasks from the data source
   */
  refreshTasks(): Promise<Task[]>;

  /**
   * Start a task (change status to ACTIVE)
   */
  startTask(id: string): Promise<Task | null>;

  /**
   * Complete a task (change status to COMPLETED)
   */
  completeTask(id: string): Promise<Task | null>;
}
