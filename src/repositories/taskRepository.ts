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
interface OfflineTask extends Task, ISyncableEntity {
  notes: string | null;
  checklist_items: any[];
  note_type: 'text' | 'checklist' | 'both' | null;
}

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
    // First get the base task model from the transformer
    const taskModel = this.taskTransformer.toModel(dto);
    
    // Map the TaskModel to our OfflineTask format
    const offlineTask: OfflineTask = {
      // Map core fields from model
      id: taskModel.id,
      title: taskModel.title,
      description: taskModel.description || '',
      status: taskModel.status,
      priority: taskModel.priority,
      
      // Convert properly formatted dates from model to ISO strings for our repository
      due_date: taskModel.dueDate ? taskModel.dueDate.toISOString() : null,
      created_at: taskModel.createdAt.toISOString(),
      updated_at: taskModel.updatedAt ? taskModel.updatedAt.toISOString() : null,
      
      // Convert time fields (model uses minutes, repository uses interval strings)
      estimated_time: taskModel.estimatedTimeMinutes ? `${taskModel.estimatedTimeMinutes * 60} seconds` : null,
      actual_time: taskModel.actualTimeMinutes ? `${taskModel.actualTimeMinutes * 60} seconds` : null,
      
      // Additional fields
      tags: taskModel.tags || [],
      created_by: taskModel.createdBy,
      is_deleted: taskModel.isDeleted,
      list_id: taskModel.listId,
      category_name: taskModel.categoryName,
      
      // Required fields that might not be in the model but are required by Task interface
      notes: null,
      checklist_items: [],
      note_type: null,
      
      // Sync fields
      _pendingSync: false,
      _lastUpdated: new Date().toISOString(),
      _sync_error: undefined
    };
    
    return offlineTask;
  }
  
  /**
   * Transform domain model to API DTO
   */
  protected domainToApi(model: OfflineTask): Omit<TaskApiDto, 'id'> {
    // First convert our OfflineTask to a proper TaskModel
    const taskModel: any = {
      id: model.id,
      title: model.title,
      description: model.description,
      status: model.status,
      priority: model.priority,
      
      // Convert ISO date strings to Date objects
      dueDate: model.due_date ? new Date(model.due_date) : null,
      createdAt: new Date(model.created_at),
      updatedAt: model.updated_at ? new Date(model.updated_at) : null,
      
      // Convert time intervals to minutes
      estimatedTimeMinutes: this.parseIntervalToMinutes(model.estimated_time),
      actualTimeMinutes: this.parseIntervalToMinutes(model.actual_time),
      
      // Additional fields
      tags: model.tags,
      createdBy: model.created_by,
      isDeleted: model.is_deleted,
      listId: model.list_id,
      categoryName: model.category_name,
      
      // Default required fields by TaskModel that aren't in our OfflineTask
      checklistItems: [],
      pendingSync: model._pendingSync,
      lastUpdated: model._lastUpdated ? new Date(model._lastUpdated) : null,
      syncError: model._sync_error
    };
    
    // Now convert TaskModel to API DTO using the transformer
    const apiDto = this.taskTransformer.toApi(taskModel);
    
    // Return without id to match the BaseRepository interface
    const { id, ...apiData } = apiDto;
    return apiData;
  }
  
  /**
   * Transform creation DTO to domain model
   */
  protected createDtoToDomain(dto: TaskCreateDTO): Omit<OfflineTask, 'id'> {
    // Convert form submission to task model
    const estimatedTime = dto.estimatedTime !== undefined && dto.estimatedTime !== null 
      ? (typeof dto.estimatedTime === 'string' ? parseInt(dto.estimatedTime, 10) : dto.estimatedTime)
      : null;
      
    return {
      title: dto.title,
      description: dto.description || '',
      status: dto.status as TaskStatusType || TaskStatus.PENDING,
      priority: dto.priority || 'medium',
      due_date: dto.dueDate ? new Date(dto.dueDate).toISOString() : null,
      estimated_time: estimatedTime !== null ? `${estimatedTime * 60} seconds` : null,
      actual_time: null,
      tags: dto.tags || [],
      category_name: dto.category || 'uncategorized',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      created_by: null,
      list_id: null,
      
      // Required fields for Task interface
      notes: null,
      checklist_items: [],
      note_type: null
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
    if (dto.estimatedTime !== undefined) {
      // Handle the estimatedTime correctly as it could be number or string
      const timeValue = typeof dto.estimatedTime === 'string' 
        ? parseInt(dto.estimatedTime, 10) 
        : dto.estimatedTime;
      updates.estimated_time = timeValue ? `${timeValue * 60} seconds` : null;
    }
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
   * Parse Postgres interval format (seconds) to minutes
   * @private
   */
  private parseIntervalToMinutes(interval: string | null): number | null {
    if (!interval) return null;
    
    // Parse PostgreSQL interval format
    const match = interval.match(/^(\d+) seconds$/);
    if (match && match[1]) {
      const seconds = parseInt(match[1], 10);
      return !isNaN(seconds) ? Math.round(seconds / 60) : null;
    }
    
    return null;
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
