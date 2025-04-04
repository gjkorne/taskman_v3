import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { TaskSubmitData } from '../components/TaskForm/schema';
import { SupabaseAdapter } from './storage/supabaseAdapter';
import { IndexedDBAdapter } from './storage/indexedDBAdapter';
import { NetworkStatusService } from '../services/networkStatusService';
import { TaskApiDto } from '../types/api/taskDto';
import { BaseRepository, ISyncableEntity } from './baseRepository';
import { transformerFactory } from '../utils/transforms/TransformerFactory';

/**
 * Type definitions for task data transfer objects
 */
export type TaskCreateDTO = TaskSubmitData;
export type TaskUpdateDTO = Partial<TaskSubmitData>;

/**
 * Extended Task type with offline sync properties
 */
interface OfflineTask extends Task, ISyncableEntity {}

/**
 * TaskRepository - provides unified access to task data across local and remote storage
 * 
 * This repository implements offline-second architecture:
 * - Remote storage (Supabase) is the primary data source
 * - Local storage is used as a fallback when offline
 * - Changes made while offline are synced when connectivity is restored
 */
export class TaskRepository extends BaseRepository<OfflineTask, TaskCreateDTO, TaskUpdateDTO, TaskApiDto> {
  private taskTransformer = transformerFactory.getTaskTransformer();
  
  constructor(networkStatus?: NetworkStatusService) {
    // Initialize network status service
    const networkStatusService = networkStatus || new NetworkStatusService();
    
    // Initialize storage adapters
    const remoteAdapter = new SupabaseAdapter<TaskApiDto>('tasks', {
      select: '*',
      orderBy: { column: 'updated_at', ascending: false },
    });
    
    // Initialize local adapter
    const localAdapter = new IndexedDBAdapter<OfflineTask>('tasks', {
      dbName: 'taskman_offline_db',
      version: 1
    });
    
    // Call base constructor with adapters
    super(remoteAdapter, localAdapter, networkStatusService);
    
    // Initialize event listeners
    this.on('entity-created', (task: Task) => {
      console.log('Task created:', task.id, task.title);
    });
    
    this.on('entity-updated', (task: Task) => {
      console.log('Task updated:', task.id, task.title);
    });
    
    this.on('entity-deleted', (taskId: string) => {
      console.log('Task deleted:', taskId);
    });
  }
  
  /**
   * Transform API DTO to domain model
   */
  protected apiToDomain(dto: TaskApiDto): OfflineTask {
    // Use the existing transformer to convert API to model
    const taskModel = this.taskTransformer.apiToModel(dto);
    
    // Add offline sync properties
    return {
      ...taskModel,
      _pendingSync: false,
      _lastUpdated: new Date().toISOString(),
      _sync_error: undefined
    } as OfflineTask;
  }
  
  /**
   * Transform domain model to API DTO
   */
  protected domainToApi(model: OfflineTask): Omit<TaskApiDto, 'id'> {
    // Use the existing transformer to convert model to API
    return this.taskTransformer.modelToApi(model);
  }
  
  /**
   * Transform creation DTO to domain model
   */
  protected createDtoToDomain(dto: TaskCreateDTO): Omit<OfflineTask, 'id'> {
    // Convert form submission to task model
    return {
      title: dto.title,
      description: dto.description || '',
      status: dto.status as TaskStatusType || TaskStatus.PENDING,
      priority: dto.priority || 'medium',
      due_date: dto.dueDate ? new Date(dto.dueDate).toISOString() : null,
      estimated_time: this.formatTimeInput(dto.estimatedTime),
      actual_time: null,
      tags: dto.tags || [],
      category_name: dto.category || 'uncategorized',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false
    } as Omit<OfflineTask, 'id'>;
  }
  
  /**
   * Apply update DTO to domain model
   */
  protected applyUpdateDto(model: OfflineTask, dto: TaskUpdateDTO): OfflineTask {
    const updates: Partial<OfflineTask> = {
      ...model
    };
    
    // Apply each field if present in DTO
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status as TaskStatusType;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.dueDate !== undefined) updates.due_date = dto.dueDate ? new Date(dto.dueDate).toISOString() : null;
    if (dto.estimatedTime !== undefined) updates.estimated_time = this.formatTimeInput(dto.estimatedTime);
    if (dto.tags !== undefined) updates.tags = dto.tags;
    if (dto.category !== undefined) updates.category_name = dto.category;
    
    // Always update the updated_at timestamp
    updates.updated_at = new Date().toISOString();
    
    return updates as OfflineTask;
  }
  
  /**
   * Update a task's status
   * Convenience method that wraps update with a status-only change
   */
  async updateTaskStatus(id: string, status: TaskStatusType): Promise<OfflineTask | null> {
    return this.update(id, { status } as TaskUpdateDTO);
  }
  
  /**
   * Format time input from minutes to interval format
   * @private
   */
  private formatTimeInput(timeInMinutes?: number | null): string | null {
    if (!timeInMinutes) return null;
    return `${timeInMinutes * 60} seconds`;
  }
  
  /**
   * Get tasks by status
   * Convenience method to filter tasks by status
   */
  async getTasksByStatus(status: TaskStatusType): Promise<OfflineTask[]> {
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.status === status);
  }
  
  /**
   * Get tasks by category
   * Convenience method to filter tasks by category
   */
  async getTasksByCategory(categoryName: string): Promise<OfflineTask[]> {
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.category_name === categoryName);
  }
}

// Create singleton instance
export const taskRepository = new TaskRepository();
