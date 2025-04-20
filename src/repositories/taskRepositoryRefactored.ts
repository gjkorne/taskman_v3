import { Task, TaskStatusType, TaskPriorityType } from '../types/task';
import { TaskSubmitData } from '../components/TaskForm/schema';
import { SupabaseAdapter } from './storage/supabaseAdapter';
import { IndexedDBAdapter } from './storage/indexedDBAdapter';
import { NetworkStatusService } from '../services/networkStatusService';
import { TaskApiDto } from '../types/api/taskDto';
import { BaseRepository, ISyncableEntity } from './baseRepository';

/**
 * Type definitions for task data transfer objects
 */
export type TaskCreateDTO = TaskSubmitData;
export type TaskUpdateDTO = Partial<TaskSubmitData>;

/**
 * Extended Task type with offline sync properties
 */
interface OfflineTask extends Task, ISyncableEntity {
  notes: any;
  checklist_items: any;
  note_type: any;
  nlp_tokens: any;
  extracted_entities: any;
  embedding_data: any;
  confidence_score: any;
  processing_metadata: any;
}

/**
 * TaskRepository - provides unified access to task data across local and remote storage
 *
 * This repository implements offline-second architecture:
 * - Remote storage (Supabase) is the primary data source
 * - Local storage is used as a fallback when offline
 * - Changes made while offline are synced when connectivity is restored
 */
export class TaskRepository extends BaseRepository<
  OfflineTask,
  TaskCreateDTO,
  TaskUpdateDTO,
  TaskApiDto
> {
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
      version: 1,
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
    // Convert TaskModel to OfflineTask format and add offline sync properties
    const offlineTask: OfflineTask = {
      // Copy original fields from API DTO
      id: dto.id,
      title: dto.title,
      description: dto.description || '',
      status: dto.status as TaskStatusType,
      priority: dto.priority as TaskPriorityType,
      due_date: dto.due_date,
      estimated_time: dto.estimated_time,
      actual_time: dto.actual_time,
      tags: dto.tags || [],
      created_at: dto.created_at,
      updated_at: dto.updated_at,
      created_by: dto.created_by,
      is_deleted: dto.is_deleted || false,
      list_id: dto.list_id,
      category_name: dto.category_name,

      // Notes and checklist fields required by TaskModel
      notes: dto.notes,
      checklist_items: dto.checklist_items,
      note_type: dto.note_type,

      // NLP fields
      nlp_tokens: dto.nlp_tokens,
      extracted_entities: dto.extracted_entities,
      embedding_data: dto.embedding_data,
      confidence_score: dto.confidence_score,
      processing_metadata: dto.processing_metadata,

      // Add sync properties
      _pendingSync: false,
      _lastUpdated: new Date().toISOString(),
      _sync_error: undefined,
    };

    return offlineTask;
  }

  /**
   * Transform domain model to API DTO
   */
  protected domainToApi(model: OfflineTask): Omit<TaskApiDto, 'id'> {
    // Create API DTO directly from OfflineTask
    return {
      title: model.title,
      description: model.description,
      status: model.status,
      priority: model.priority,
      due_date: model.due_date,
      estimated_time: model.estimated_time,
      actual_time: model.actual_time,
      tags: model.tags,
      created_at: model.created_at,
      updated_at: model.updated_at,
      created_by: model.created_by,
      is_deleted: model.is_deleted,
      list_id: model.list_id,
      category_name: model.category_name,

      // Add missing properties required by TaskApiDto
      notes: model.notes,
      checklist_items: model.checklist_items,
      note_type: model.note_type,
      nlp_tokens: model.nlp_tokens,
      extracted_entities: model.extracted_entities,
      embedding_data: model.embedding_data,
      confidence_score: model.confidence_score,
      processing_metadata: model.processing_metadata,
    };
  }

  /**
   * Convert creation DTO to domain model
   */
  protected createDtoToDomain(dto: TaskCreateDTO): Omit<OfflineTask, 'id'> {
    // Convert form submission to task model
    return {
      title: dto.title,
      description: dto.description || '',
      status: (dto.status as TaskStatusType) || 'pending',
      priority: dto.priority || 'medium',
      due_date: dto.dueDate ? new Date(dto.dueDate).toISOString() : null,
      estimated_time: this.formatTimeInput(
        dto.estimatedTime ? Number(dto.estimatedTime) : null
      ),
      actual_time: null,
      tags: dto.tags || [],
      category_name: dto.category || 'uncategorized',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      list_id: null,
      created_by: null,

      // Notes and checklist fields
      notes: null,
      checklist_items: null,
      note_type: null,

      // NLP fields
      nlp_tokens: null,
      extracted_entities: null,
      embedding_data: null,
      confidence_score: null,
      processing_metadata: null,

      // Add sync properties
      _pendingSync: true,
      _lastUpdated: new Date().toISOString(),
      _sync_error: undefined,
    } as Omit<OfflineTask, 'id'>;
  }

  /**
   * Apply update DTO to domain model
   */
  protected applyUpdateDto(
    model: OfflineTask,
    dto: TaskUpdateDTO
  ): OfflineTask {
    const updates: Partial<OfflineTask> = {
      ...model,
    };

    // Apply each field if present in DTO
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status as TaskStatusType;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.dueDate !== undefined)
      updates.due_date = dto.dueDate
        ? new Date(dto.dueDate).toISOString()
        : null;
    if (dto.estimatedTime !== undefined)
      updates.estimated_time = this.formatTimeInput(
        dto.estimatedTime ? Number(dto.estimatedTime) : null
      );
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
  async updateTaskStatus(
    id: string,
    status: TaskStatusType
  ): Promise<OfflineTask | null> {
    return this.update(id, { status } as TaskUpdateDTO);
  }

  /**
   * Format time input from minutes to interval format
   * @private
   */
  private formatTimeInput(timeInMinutes: number | null): string | null {
    if (timeInMinutes === null) return null;
    return `${timeInMinutes * 60} seconds`;
  }

  /**
   * Get tasks by status
   * Convenience method to filter tasks by status
   */
  async getTasksByStatus(status: TaskStatusType): Promise<OfflineTask[]> {
    const allTasks = await this.getAll();
    return allTasks.filter((task) => task.status === status);
  }

  /**
   * Get tasks by category
   * Convenience method to filter tasks by category
   */
  async getTasksByCategory(categoryName: string): Promise<OfflineTask[]> {
    const allTasks = await this.getAll();
    return allTasks.filter((task) => task.category_name === categoryName);
  }
}

// Create singleton instance
export const taskRepository = new TaskRepository();
