import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { TaskSubmitData } from '../components/TaskForm/schema';
import { IOfflineCapableRepository } from './types';
import { SupabaseAdapter } from './storage/supabaseAdapter';
import { IndexedDBAdapter } from './storage/indexedDBAdapter';
import { NetworkStatusService } from '../services/networkStatusService';
import { TaskApiDto } from '../types/api/taskDto';
import { TaskModel } from '../types/models/TaskModel';
import { transformerFactory } from '../utils/transforms/TransformerFactory';
import {
  parseNotes,
  stringifyNotes,
  notesToDatabaseFormat,
  databaseToNotesFormat,
} from '../types/list';

/**
 * Type definitions for task data transfer objects
 */
export type TaskCreateDTO = TaskSubmitData;
export type TaskUpdateDTO = Partial<TaskSubmitData>;

/**
 * Extended Task type with offline sync properties
 */
interface OfflineTask extends Task {
  _pendingSync?: boolean;
  _lastUpdated?: string;
  _sync_error?: string; // Update type to string
}

/**
 * TaskRepository - provides unified access to task data across local and remote storage
 *
 * This repository implements offline-second architecture:
 * - Remote storage (Supabase) is the primary data source
 * - Local storage is used as a fallback when offline
 * - Changes made while offline are synced when connectivity is restored
 */
export class TaskRepository
  implements IOfflineCapableRepository<Task, TaskCreateDTO, TaskUpdateDTO>
{
  private remoteAdapter: SupabaseAdapter<TaskApiDto>;
  private localAdapter!: IndexedDBAdapter<OfflineTask>; // Using definite assignment assertion
  private networkStatus: NetworkStatusService;
  private useLocalAsBackup = false; // Flag to control whether local storage is used as a backup
  private syncInProgress = false; // Flag to prevent multiple simultaneous syncs
  private taskTransformer = transformerFactory.getTaskTransformer();

  constructor(networkStatus?: NetworkStatusService) {
    // Initialize network status service
    this.networkStatus = networkStatus || new NetworkStatusService();

    // Initialize storage adapters
    this.remoteAdapter = new SupabaseAdapter<TaskApiDto>('tasks', {
      select: '*',
      orderBy: { column: 'updated_at', ascending: false },
      // No transformations here - we'll use the TaskTransformer
      transformRow: (row: any): TaskApiDto => row,
      // Prepare data for DB insertion/update
      prepareData: (data: Partial<TaskApiDto>): Record<string, any> => ({
        ...data,
      }),
    });

    // Initialize local storage adapter for backup when offline
    try {
      this.localAdapter = new IndexedDBAdapter<OfflineTask>('tasks', {
        // Same transformation options as remote adapter
        transformRow: (row: any): OfflineTask => ({
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          priority: row.priority,
          due_date: row.due_date,
          estimated_time: row.estimated_time,
          actual_time: row.actual_time,
          tags: row.tags || [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by,
          is_deleted: row.is_deleted === true,
          list_id: row.list_id,
          category_name: row.category_name,

          // These are offline sync fields
          _pendingSync: row._pendingSync === true,
          _lastUpdated: row._lastUpdated,
          _sync_error: row._sync_error,

          // NLP fields
          nlp_tokens: row.nlp_tokens,
          extracted_entities: row.extracted_entities,
          embedding_data: row.embedding_data,
          confidence_score: row.confidence_score,
          processing_metadata: row.processing_metadata,

          // Notes and checklist fields
          notes: row.notes,
          checklist_items: row.checklist_items,
          note_type: row.note_type,
        }),
        prepareData: (data: Partial<OfflineTask>): Record<string, any> => ({
          ...data,
        }),
      });

      // Test if IndexedDB is available and working
      this.testIndexedDB();
    } catch (error) {
      console.error('Error initializing IndexedDB adapter:', error);
      console.warn('Offline functionality will be limited');
    }
  }

  /**
   * Test IndexedDB connectivity and availability
   * This helps determine if local storage can be used as a backup
   */
  private async testIndexedDB(): Promise<void> {
    try {
      // Perform a simple read operation to test availability
      await this.localAdapter.getAll();
      this.useLocalAsBackup = true;
      console.log('IndexedDB initialized successfully for offline backup');
    } catch (error) {
      console.error(
        'IndexedDB test failed, offline functionality will be limited:',
        error
      );
      this.useLocalAsBackup = false;
    }
  }

  /**
   * Convert TaskModel to Task (for application use)
   */
  private modelToLegacyTask(model: TaskModel): Task {
    // Handle notes data conversion
    let description = model.description || '';

    // Include notes data in description field for compatibility
    if (model.notes || model.checklistItems) {
      try {
        const notesObj = databaseToNotesFormat(
          model.notes,
          model.checklistItems || [], // Ensure we always pass an array, not null
          model.noteType || 'text' // Ensure we always pass a non-null string
        );
        // Stringify the notes object to a JSON string
        description = stringifyNotes(notesObj);
      } catch (error) {
        console.error('Error converting notes to string:', error);
        // Fall back to plain description
        description = model.description || '';
      }
    }

    return {
      id: model.id,
      title: model.title,
      description: description,
      status: model.status as TaskStatusType,
      priority: model.priority,
      due_date: model.dueDate ? model.dueDate.toISOString() : null,
      estimated_time:
        model.estimatedTimeMinutes !== null
          ? String(model.estimatedTimeMinutes)
          : null,
      actual_time:
        model.actualTimeMinutes !== null
          ? String(model.actualTimeMinutes)
          : null,
      tags: model.tags || [],
      created_at: model.createdAt.toISOString(),
      updated_at: model.updatedAt ? model.updatedAt.toISOString() : null,
      created_by: model.createdBy,
      is_deleted: model.isDeleted,
      list_id: model.listId,
      category_name: model.categoryName,

      // Notes and checklist fields
      notes: model.notes,
      checklist_items: model.checklistItems,
      note_type: model.noteType,

      // NLP fields
      nlp_tokens: model.nlpTokens,
      extracted_entities: model.extractedEntities,
      embedding_data: model.embeddingData,
      confidence_score: model.confidenceScore,
      processing_metadata: model.processingMetadata,

      // Raw input for UI
      rawInput: model.rawInput,

      // Offline sync metadata
      _is_synced: model.isSynced,
      _sync_status: model.syncStatus === 'none' ? undefined : model.syncStatus,
      _conflict_resolution: model.conflictResolution,
      _local_updated_at: model.localUpdatedAt
        ? model.localUpdatedAt.toISOString()
        : undefined,
      _sync_error: model.syncError || undefined, // Convert null to undefined to match Task interface
    };
  }

  /**
   * Convert Task to TaskModel (for API/storage)
   */
  private legacyTaskToModel(task: Task): TaskModel {
    // Process description field to extract notes format if available
    let notesData = null;
    let checklistItems = null;
    let noteType: 'text' | 'checklist' | 'both' = 'text';

    // Handle new notes structure if present
    if (task.notes || task.checklist_items) {
      notesData = task.notes;
      checklistItems = task.checklist_items;
      noteType = task.note_type as 'text' | 'checklist' | 'both';
    }
    // Legacy: Try to parse description as a notes object
    else if (task.description) {
      try {
        const parsedNotes = parseNotes(task.description);
        const { notes, checklist_items, note_type } =
          notesToDatabaseFormat(parsedNotes);
        notesData = notes;
        checklistItems = checklist_items;
        noteType = note_type as 'text' | 'checklist' | 'both';
      } catch (error) {
        // If parsing fails, treat as plain text
        notesData = { format: 'text', content: task.description };
        noteType = 'text';
      }
    }

    // Convert string time values to numbers if present
    const estimatedTimeMinutes = task.estimated_time
      ? parseInt(task.estimated_time, 10)
      : null;
    const actualTimeMinutes = task.actual_time
      ? parseInt(task.actual_time, 10)
      : null;

    // Make sure syncStatus is one of the allowed values
    let syncStatus: 'pending' | 'synced' | 'failed' | undefined = undefined;
    if (task._sync_status) {
      if (['pending', 'synced', 'failed'].includes(task._sync_status)) {
        syncStatus = task._sync_status as 'pending' | 'synced' | 'failed';
      }
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description || null, // Keep for backwards compatibility
      status: task.status as TaskStatusType,
      priority: task.priority,
      dueDate: task.due_date ? new Date(task.due_date) : null,
      estimatedTimeMinutes: estimatedTimeMinutes,
      actualTimeMinutes: actualTimeMinutes,
      tags: task.tags || [],
      createdAt: new Date(task.created_at),
      updatedAt: task.updated_at ? new Date(task.updated_at) : null,
      createdBy: task.created_by || null,
      isDeleted: task.is_deleted === true,
      listId: task.list_id || null,
      categoryName: task.category_name || null,

      // Notes and Checklist fields
      notes: notesData,
      checklistItems: checklistItems,
      noteType: noteType,

      nlpTokens: task.nlp_tokens,
      extractedEntities: task.extracted_entities,
      embeddingData: task.embedding_data,
      confidenceScore: task.confidence_score,
      processingMetadata: task.processing_metadata,
      rawInput: task.rawInput,
      isSynced: task._is_synced === true,
      syncStatus: syncStatus || 'pending', // Ensure we never pass undefined to match TaskModel
      conflictResolution: task._conflict_resolution || null,
      localUpdatedAt: task._local_updated_at
        ? new Date(task._local_updated_at)
        : null,
      syncError: task._sync_error || null, // String or null
    };
  }

  /**
   * Retrieve all tasks - primarily from remote, fallback to local when offline
   */
  async getAll(): Promise<Task[]> {
    console.log('TaskRepository.getAll: Starting to fetch tasks');
    console.log(
      'Network status:',
      this.networkStatus.isOnline() ? 'Online' : 'Offline'
    );

    // First try to get from remote storage
    if (this.networkStatus.isOnline()) {
      try {
        console.log(
          'TaskRepository.getAll: Attempting to fetch from remote storage'
        );
        const remoteTaskDtos = await this.remoteAdapter.getAll();
        console.log(
          'TaskRepository.getAll: Successfully fetched from remote storage',
          remoteTaskDtos.length,
          'tasks'
        );

        // Transform API DTOs to domain models
        const remoteTasks = remoteTaskDtos.map((dto) => {
          // First convert to TaskModel
          const taskModel = this.taskTransformer.toModel(dto);

          // Then convert to legacy Task type (will be phased out in future)
          return this.modelToLegacyTask(taskModel);
        });

        // If we have local storage capability, cache the results for offline use
        if (this.useLocalAsBackup) {
          console.log('TaskRepository.getAll: Caching tasks locally');
          this.cacheTasksLocally(remoteTasks).catch((error) =>
            console.error('Failed to cache tasks locally:', error)
          );
        }

        return remoteTasks;
      } catch (error) {
        console.error(
          'TaskRepository.getAll: Error fetching tasks from remote:',
          error
        );
        // Fall back to local storage if online fetch fails
      }
    }

    // If we're offline or remote fetch failed, try local storage
    if (this.useLocalAsBackup) {
      try {
        console.log(
          'TaskRepository.getAll: Attempting to fetch from local storage'
        );
        const localTasks = await this.localAdapter.getAll();
        console.log(
          'TaskRepository.getAll: Successfully fetched from local storage',
          localTasks.length,
          'tasks'
        );
        return localTasks;
      } catch (localError) {
        console.error(
          'TaskRepository.getAll: Error fetching from local storage:',
          localError
        );
      }
    }

    // If both remote and local fail, return empty array
    console.warn(
      'TaskRepository.getAll: Unable to fetch tasks from any source'
    );
    return [];
  }

  /**
   * Get a task by ID - try remote first, then local if offline
   */
  async getById(id: string): Promise<Task | null> {
    // Try remote first if online
    if (this.networkStatus.isOnline()) {
      try {
        const remoteTaskDto = await this.remoteAdapter.getById(id);

        // Transform API DTO to domain model
        const remoteTask = remoteTaskDto
          ? this.modelToLegacyTask(this.taskTransformer.toModel(remoteTaskDto))
          : null;

        // Cache the task locally if found
        if (remoteTask && this.useLocalAsBackup) {
          this.localAdapter
            .update(id, remoteTask as OfflineTask)
            .catch((error) =>
              console.error(`Failed to cache task ${id} locally:`, error)
            );
        }

        return remoteTask;
      } catch (error) {
        console.error(`Error fetching task ${id} from remote:`, error);
        // Fall back to local if remote fails
      }
    }

    // If offline or remote failed, try local
    if (this.useLocalAsBackup) {
      try {
        const localTask = await this.localAdapter.getById(id);
        return localTask;
      } catch (localError) {
        console.error(
          `Error fetching task ${id} from local storage:`,
          localError
        );
      }
    }

    // If both remote and local fail, return null
    return null;
  }

  /**
   * Create a new task
   */
  async create(data: TaskCreateDTO): Promise<Task> {
    // Prepare the data for creation
    const now = new Date().toISOString();

    // Use the transformer to properly format the task for the API
    const taskModel: Partial<TaskModel> = {
      title: data.title,
      description: data.description || null,
      status: data.status || TaskStatus.PENDING,
      priority: data.priority || 'medium',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      // Map from string to number for estimated time
      estimatedTimeMinutes: data.estimatedTime
        ? parseInt(data.estimatedTime, 10)
        : null,
      tags: data.tags || [],
      categoryName: data.category || null,
      createdAt: new Date(),
      isDeleted: false,
    };

    // If we have a user ID from the session, add it to the task
    const currentUser = this.getCurrentUserId();
    if (currentUser) {
      taskModel.createdBy = currentUser;
    }

    // Create a temporary local ID for offline support
    const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const fullTaskModel: TaskModel = {
      id: tempId,
      title: taskModel.title || '',
      description: taskModel.description || null,
      status: taskModel.status || 'pending',
      priority: taskModel.priority || 'medium',
      dueDate: taskModel.dueDate || null,
      estimatedTimeMinutes: taskModel.estimatedTimeMinutes || null,
      actualTimeMinutes: null,
      tags: taskModel.tags || [],
      createdAt: taskModel.createdAt || new Date(),
      updatedAt: null,
      createdBy: taskModel.createdBy || null,
      isDeleted: taskModel.isDeleted || false,
      listId: taskModel.listId || null,
      categoryName: taskModel.categoryName || null,

      // New fields for notes and checklists
      notes: taskModel.notes || null,
      checklistItems: taskModel.checklistItems || null,
      noteType: taskModel.noteType || 'text',

      nlpTokens: null,
      extractedEntities: null,
      embeddingData: null,
      confidenceScore: null,
      processingMetadata: null,
      rawInput: data.rawInput,
      isSynced: false,
      syncStatus: 'pending' as const, // Explicitly type as a constant to match TaskModel
      conflictResolution: null,
      localUpdatedAt: new Date(),
      syncError: null, // Changed back to null to match TaskModel interface
    };

    // Convert the full TaskModel to API format
    const taskApiDto = this.taskTransformer.toCreateDto(fullTaskModel);

    try {
      // Try to create in remote storage first
      if (this.networkStatus.isOnline()) {
        const remoteTaskDto = await this.remoteAdapter.create(taskApiDto);

        // Transform back to model, then to legacy Task
        const remoteTask = this.modelToLegacyTask(
          this.taskTransformer.toModel(remoteTaskDto)
        );

        // Update local cache if we're using it
        if (this.useLocalAsBackup) {
          await this.localAdapter.create({
            ...remoteTask,
            _pendingSync: false,
            _lastUpdated: now,
          });
        }

        return remoteTask;
      } else {
        // If offline, store in local storage with metadata indicating it needs sync
        const legacyTask = this.modelToLegacyTask(fullTaskModel);

        await this.localAdapter.create({
          ...legacyTask,
          _pendingSync: true,
          _lastUpdated: now,
        });

        return legacyTask;
      }
    } catch (error) {
      console.error('Error creating task:', error);

      // If we're configured to use local storage as backup
      if (this.useLocalAsBackup) {
        console.log('Saving task to local storage as fallback');

        const legacyTask = this.modelToLegacyTask(fullTaskModel);

        // Save to local storage with metadata to sync later
        await this.localAdapter.create({
          ...legacyTask,
          _pendingSync: true,
          _sync_error: String(error),
          _lastUpdated: now,
        });

        return legacyTask;
      }

      // If we're not using local storage backup, just propagate the error
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async update(id: string, data: TaskUpdateDTO): Promise<Task> {
    const now = new Date().toISOString();

    // If online, update remote first
    if (this.networkStatus.isOnline()) {
      try {
        // First get the current task to ensure we have a complete model
        const currentTask = await this.getById(id);
        if (!currentTask) {
          throw new Error(`Task ${id} not found`);
        }

        // Convert to TaskModel then apply updates
        const currentModel = this.legacyTaskToModel(currentTask);

        // Apply updates from the data object
        const updatedModel: TaskModel = {
          ...currentModel,
          // Map fields from update data
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.priority !== undefined && { priority: data.priority }),
          ...(data.dueDate !== undefined && {
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          }),
          ...(data.estimatedTime !== undefined && {
            estimatedTimeMinutes: data.estimatedTime
              ? parseInt(data.estimatedTime, 10)
              : null,
          }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.category !== undefined && { categoryName: data.category }),
          // Always update the updatedAt timestamp
          updatedAt: new Date(),
        };

        // Convert TaskModel to API DTO
        const taskApiDto = this.taskTransformer.toApi(updatedModel);

        const remoteTaskDto = await this.remoteAdapter.update(id, taskApiDto);

        // Transform back to model, then to legacy Task
        const remoteTask = this.modelToLegacyTask(
          this.taskTransformer.toModel(remoteTaskDto)
        );

        // Update local cache if we're using it
        if (this.useLocalAsBackup) {
          await this.localAdapter.update(id, {
            ...remoteTask,
            _pendingSync: false,
            _lastUpdated: now,
          });
        }

        return remoteTask;
      } catch (error) {
        console.error(`Error updating task ${id} in remote:`, error);
        // Fall back to local update if offline
        if (!this.useLocalAsBackup) {
          throw error;
        }
      }
    }

    // Update locally if offline or remote update failed
    if (this.useLocalAsBackup) {
      try {
        // Get the existing task
        const existingTask = await this.localAdapter.getById(id);
        if (!existingTask) {
          throw new Error(`Task ${id} not found in local storage`);
        }

        // Convert to TaskModel then apply updates
        const currentModel = this.legacyTaskToModel(existingTask);

        // Apply updates from the data object
        const updatedModel: TaskModel = {
          ...currentModel,
          // Map fields from update data
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.priority !== undefined && { priority: data.priority }),
          ...(data.dueDate !== undefined && {
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          }),
          ...(data.estimatedTime !== undefined && {
            estimatedTimeMinutes: data.estimatedTime
              ? parseInt(data.estimatedTime, 10)
              : null,
          }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.category !== undefined && { categoryName: data.category }),
          // Always update the updatedAt timestamp
          updatedAt: new Date(),
        };

        // Convert TaskModel to legacy Task
        const legacyTask = this.modelToLegacyTask(updatedModel);

        await this.localAdapter.update(id, {
          ...legacyTask,
          _pendingSync: true,
          _lastUpdated: now,
        });

        return legacyTask;
      } catch (localError) {
        console.error(
          `Error updating task ${id} in local storage:`,
          localError
        );
        throw localError;
      }
    }

    throw new Error(
      `Cannot update task ${id}: both remote and local storage unavailable`
    );
  }

  /**
   * Delete a task (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    // First try remote deletion if online
    if (this.networkStatus.isOnline()) {
      try {
        // First get the current task to ensure we have a complete model
        const currentTask = await this.getById(id);
        if (!currentTask) {
          throw new Error(`Task ${id} not found`);
        }

        // Convert to TaskModel and mark as deleted
        const currentModel = this.legacyTaskToModel(currentTask);
        const deletedModel: TaskModel = {
          ...currentModel,
          isDeleted: true,
          updatedAt: new Date(),
        };

        // Convert TaskModel to API DTO
        const taskApiDto = this.taskTransformer.toApi(deletedModel);

        await this.remoteAdapter.update(id, taskApiDto);

        // Update local cache if we're using it
        if (this.useLocalAsBackup) {
          const task = await this.localAdapter.getById(id);
          if (task) {
            await this.localAdapter.update(id, {
              ...task,
              is_deleted: true,
              updated_at: new Date().toISOString(),
              _pendingSync: false,
            });
          }
        }

        return true;
      } catch (error) {
        console.error(`Error deleting task ${id} from remote:`, error);
        // Fall back to local if remote fails
        if (!this.useLocalAsBackup) {
          throw error;
        }
      }
    }

    // Delete locally if offline or remote delete failed
    if (this.useLocalAsBackup) {
      try {
        const task = await this.localAdapter.getById(id);
        if (!task) {
          throw new Error(`Task ${id} not found in local storage`);
        }

        await this.localAdapter.update(id, {
          ...task,
          is_deleted: true,
          updated_at: new Date().toISOString(),
          _pendingSync: true,
        });

        return true;
      } catch (localError) {
        console.error(
          `Error deleting task ${id} from local storage:`,
          localError
        );
        throw localError;
      }
    }

    throw new Error(
      'Cannot delete task: both remote and local storage unavailable'
    );
  }

  /**
   * Cache tasks in local storage for offline use
   */
  private async cacheTasksLocally(tasks: Task[]): Promise<void> {
    if (!this.useLocalAsBackup) return;

    // Store each task in IndexedDB
    for (const task of tasks) {
      try {
        const existing = await this.localAdapter.getById(task.id);
        if (existing) {
          await this.localAdapter.update(task.id, task as OfflineTask);
        } else {
          await this.localAdapter.create(task as OfflineTask);
        }
      } catch (error) {
        console.error(`Error caching task ${task.id} locally:`, error);
      }
    }
  }

  /**
   * Sync changes between local and remote storage
   */
  async sync(): Promise<void> {
    // Skip if sync already in progress or we're not using local storage
    if (this.syncInProgress || !this.useLocalAsBackup) {
      return;
    }

    // Skip if offline
    if (!this.networkStatus.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    this.syncInProgress = true;

    try {
      // Get all local tasks with pending changes
      console.log('Checking for tasks with pending sync...');
      const pendingTasks = await this.localAdapter.query(
        (task) => !!task._pendingSync
      );

      if (pendingTasks.length === 0) {
        console.log('No pending changes to sync');
        return;
      }

      console.log(`Found ${pendingTasks.length} tasks with pending changes`);

      // Sync each task
      for (const task of pendingTasks) {
        console.log(`Syncing task ${task.id}...`);

        try {
          // Check if this is a local-only task (temporary ID)
          if (task.id.startsWith('temp_')) {
            // This is a new task created offline, create it on the server
            // Convert task to TaskModel
            const taskModel: TaskModel = this.legacyTaskToModel(task);

            // Convert TaskModel to API DTO
            const taskApiDto = this.taskTransformer.toCreateDto(taskModel);

            const remoteTaskDto = await this.remoteAdapter.create(taskApiDto);

            // Delete the local temporary task
            await this.localAdapter.delete(task.id);

            // Create a new task with the remote ID
            const remoteTask = this.modelToLegacyTask(
              this.taskTransformer.toModel(remoteTaskDto)
            );

            await this.localAdapter.create({
              ...remoteTask,
              _pendingSync: false,
              _lastUpdated: new Date().toISOString(),
            });

            console.log(
              `Created task ${task.id} -> ${remoteTask.id} on remote`
            );
          } else {
            // This is an existing task updated offline
            // Convert task to TaskModel
            const taskModel: TaskModel = this.legacyTaskToModel(task);

            // Convert TaskModel to API DTO
            const taskApiDto = this.taskTransformer.toApi(taskModel);

            await this.remoteAdapter.update(task.id, taskApiDto);

            // Update local task to mark as synced
            await this.localAdapter.update(task.id, {
              ...task,
              _pendingSync: false,
              _lastUpdated: new Date().toISOString(),
            });

            console.log(`Updated task ${task.id} on remote`);
          }
        } catch (error) {
          console.error(`Failed to sync task ${task.id}:`, error);

          // Mark the task with sync error
          await this.localAdapter.update(task.id, {
            ...task,
            _sync_error: String(error),
            _lastUpdated: new Date().toISOString(),
          });
        }
      }

      console.log('Sync completed');
    } catch (error) {
      console.error('Error during sync:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Checks if there are pending changes that need to be synced
   */
  async hasPendingChanges(): Promise<boolean> {
    if (!this.useLocalAsBackup) {
      return false;
    }

    try {
      const localTasks = await this.localAdapter.getAll();
      return localTasks.some((task) => task._pendingSync === true);
    } catch (error) {
      console.error('Error checking for pending changes:', error);
      return false;
    }
  }

  /**
   * Force reload data from remote storage
   */
  async forceRefresh(): Promise<void> {
    if (!this.networkStatus.isOnline()) {
      throw new Error('Cannot refresh while offline');
    }

    try {
      console.log('Forcing refresh from remote...');

      // Fetch all tasks from remote
      const remoteTaskDtos = await this.remoteAdapter.getAll();

      if (this.useLocalAsBackup) {
        // Get local tasks with pending changes to preserve them
        const localTasks = await this.localAdapter.getAll();
        const pendingTasks = localTasks.filter((task) => task._pendingSync);

        // Create a map of pending tasks by ID
        const pendingTasksMap = new Map<string, OfflineTask>();
        pendingTasks.forEach((task) => {
          if (!task.id.startsWith('local-')) {
            pendingTasksMap.set(task.id, task);
          }
        });

        // Update local storage
        for (const remoteTaskDto of remoteTaskDtos) {
          const pendingTask = pendingTasksMap.get(remoteTaskDto.id);

          if (pendingTask) {
            // Keep the pending task (don't overwrite with remote)
            continue;
          }

          // Transform API DTO to domain model
          const remoteTask = this.modelToLegacyTask(
            this.taskTransformer.toModel(remoteTaskDto)
          );

          // Update or create the task locally
          const existing = await this.localAdapter.getById(remoteTaskDto.id);
          if (existing) {
            await this.localAdapter.update(remoteTaskDto.id, {
              ...remoteTask,
              _pendingSync: false,
              _lastUpdated: new Date().toISOString(),
            } as OfflineTask);
          } else {
            await this.localAdapter.create({
              ...remoteTask,
              _pendingSync: false,
              _lastUpdated: new Date().toISOString(),
            } as OfflineTask);
          }
        }
      }

      console.log('Refresh completed');
    } catch (error) {
      console.error('Error during force refresh:', error);
      throw error;
    }
  }

  /**
   * Get the current user ID
   * This is a helper method to get the user ID from wherever it's stored
   * (session, local storage, etc.)
   */
  private getCurrentUserId(): string | null {
    // In a real implementation, this would get the user ID from the session
    // For now, just return null
    return null;
  }
}

// Create singleton instance
export const taskRepository = new TaskRepository();
