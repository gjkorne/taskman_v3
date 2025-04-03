import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { TaskSubmitData, TaskStatus as FormTaskStatus } from '../components/TaskForm/schema';
import { IOfflineCapableRepository } from './types';
import { SupabaseAdapter } from './storage/supabaseAdapter';
import { IndexedDBAdapter } from './storage/indexedDBAdapter';
import { NetworkStatusService } from '../services/networkStatusService';

/**
 * Type definitions for task data transfer objects
 */
export type TaskCreateDTO = TaskSubmitData;
export type TaskUpdateDTO = Partial<TaskSubmitData>;

/**
 * TaskRepository - provides unified access to task data across local and remote storage
 * 
 * This repository implements offline-first architecture:
 * - All operations go through local storage first
 * - Remote operations happen in the background when online
 * - Sync conflicts are resolved with configurable strategies
 */
export class TaskRepository implements IOfflineCapableRepository<Task, TaskCreateDTO, TaskUpdateDTO> {
  private remoteAdapter: SupabaseAdapter<Task>;
  private localAdapter: IndexedDBAdapter<Task>;
  private networkStatus: NetworkStatusService;
  private syncInProgress = false;

  constructor(networkStatus?: NetworkStatusService) {
    // Initialize storage adapters
    this.remoteAdapter = new SupabaseAdapter<Task>('tasks', {
      select: '*',
      orderBy: { column: 'updated_at', ascending: false },
      // Transform DB rows to domain model
      transformRow: (row: any): Task => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        status: row.status || TaskStatus.PENDING,
        priority: row.priority || 'medium',
        due_date: row.due_date,
        estimated_time: row.estimated_time,
        actual_time: row.actual_time,
        tags: row.tags || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_by: row.created_by,
        is_deleted: row.is_deleted || false,
        list_id: row.list_id,
        category_name: row.category_name || ''
      }),
      // Prepare data for DB insertion/update
      prepareData: (data: Partial<Task>): Record<string, any> => {
        // Convert domain model to DB row format
        const dbData: Record<string, any> = {};
        
        // Direct field mappings
        if (data.title !== undefined) dbData.title = data.title;
        if (data.description !== undefined) dbData.description = data.description;
        if (data.status !== undefined) dbData.status = data.status;
        if (data.priority !== undefined) dbData.priority = data.priority;
        if (data.tags !== undefined) dbData.tags = data.tags;
        if (data.is_deleted !== undefined) dbData.is_deleted = data.is_deleted;
        if (data.category_name !== undefined) dbData.category_name = data.category_name;
        
        // Same field names
        if (data.due_date !== undefined) dbData.due_date = data.due_date;
        if (data.estimated_time !== undefined) dbData.estimated_time = data.estimated_time;
        if (data.actual_time !== undefined) dbData.actual_time = data.actual_time;
        if (data.created_at !== undefined) dbData.created_at = data.created_at;
        if (data.updated_at !== undefined) dbData.updated_at = data.updated_at;
        if (data.created_by !== undefined) dbData.created_by = data.created_by;
        if (data.list_id !== undefined) dbData.list_id = data.list_id;
        
        return dbData;
      }
    });
    
    // Initialize local storage with IndexedDB
    this.localAdapter = new IndexedDBAdapter<Task>('tasks', {
      transformRow: (item: any): Task => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        status: item.status || TaskStatus.PENDING,
        priority: item.priority || 'medium',
        due_date: item.due_date,
        estimated_time: item.estimated_time,
        actual_time: item.actual_time,
        tags: item.tags || [],
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
        is_deleted: item.is_deleted || false,
        list_id: item.list_id,
        category_name: item.category_name || '',
        _is_synced: item._is_synced || false,
        _sync_status: item._sync_status || 'pending',
        _conflict_resolution: item._conflict_resolution || null,
        _local_updated_at: item._local_updated_at || new Date().toISOString()
      })
    });
    
    // Initialize network status service
    this.networkStatus = networkStatus || new NetworkStatusService();
    
    // Set up sync mechanism when connectivity changes
    this.networkStatus.onConnectivityChange((isOnline: boolean) => {
      if (isOnline) {
        this.sync();
      }
    });
  }

  /**
   * Get all tasks from primary storage
   */
  async getAll(): Promise<Task[]> {
    try {
      // First try to get from local storage
      const localTasks = await this.localAdapter.getAll();
      
      // If online, try to sync first
      if (this.networkStatus.isOnline() && !this.syncInProgress) {
        this.sync().catch(error => console.error('Background sync failed:', error));
      }
      
      // Always return local data immediately for responsiveness
      return localTasks.filter(task => !task.is_deleted);
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  /**
   * Get a task by ID
   */
  async getById(id: string): Promise<Task | null> {
    try {
      // Try local first
      const localTask = await this.localAdapter.getById(id);
      
      // If found locally, return it
      if (localTask) {
        return localTask;
      }
      
      // If online, check remote
      if (this.networkStatus.isOnline()) {
        const remoteTask = await this.remoteAdapter.getById(id);
        
        // If found remotely, save to local and return
        if (remoteTask) {
          await this.localAdapter.create({
            ...remoteTask,
            _is_synced: true
          } as Task);
          return remoteTask;
        }
      }
      
      // Not found anywhere
      return null;
    } catch (error) {
      console.error(`Error getting task ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async create(data: TaskCreateDTO): Promise<Task> {
    try {
      // Prepare task with default values
      const now = new Date().toISOString();
      const newTask: Partial<Task> = {
        ...data,
        status: data.status || TaskStatus.PENDING,
        priority: data.priority || 'medium',
        is_deleted: false,
        created_at: now,
        updated_at: now
      };
      
      // Always save locally first for instant feedback
      const localTask = await this.localAdapter.create({
        ...newTask, 
        _is_synced: false,
        _sync_status: 'pending',
        _local_updated_at: now
      } as Task);
      
      // If online, also save to remote
      if (this.networkStatus.isOnline()) {
        try {
          const remoteTask = await this.remoteAdapter.create(newTask);
          
          // Update local copy with remote ID and mark as synced
          await this.localAdapter.update(localTask.id, {
            ...remoteTask,
            _is_synced: true,
            _sync_status: 'synced',
            _local_updated_at: now
          } as Task);
          
          return remoteTask;
        } catch (error) {
          console.error('Error saving task to remote:', error);
          // Continue with local task even if remote fails
        }
      }
      
      return localTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async update(id: string, data: TaskUpdateDTO): Promise<Task> {
    try {
      // Get the existing task
      const existingTask = await this.getById(id);
      if (!existingTask) {
        throw new Error(`Task with id ${id} not found`);
      }
      
      // Add updated timestamp
      const updateData: Partial<Task> = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      // Always update locally first
      const localTask = await this.localAdapter.update(id, {
        ...updateData,
        _is_synced: false,
        _sync_status: 'pending',
        _local_updated_at: new Date().toISOString()
      } as Task);
      
      // If online, also update remote
      if (this.networkStatus.isOnline()) {
        try {
          const remoteTask = await this.remoteAdapter.update(id, updateData);
          
          // Mark as synced
          await this.localAdapter.update(id, {
            _is_synced: true,
            _sync_status: 'synced'
          } as Task);
          
          return remoteTask;
        } catch (error) {
          console.error(`Error updating task ${id} remotely:`, error);
          // Continue with local task even if remote fails
        }
      }
      
      return localTask;
    } catch (error) {
      console.error(`Error updating task ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update task status
   * @param id Task ID
   * @param status New status - must be one of the valid statuses in the TaskSubmitData.status type
   */
  async updateStatus(id: string, status: string): Promise<Task> {
    // We need to validate that the status is compatible with the form schema
    // The schema.ts file's VALID_STATUSES doesn't include 'paused' but the Task interface does
    const validFormStatuses: string[] = ['pending', 'active', 'in_progress', 'completed', 'archived'];
    
    // First check if the status is valid for the form
    if (!validFormStatuses.includes(status)) {
      // If the status is 'paused', we need to map it to a compatible form status
      if (status === 'paused') {
        // We'll map 'paused' to 'in_progress' for the form
        status = 'in_progress';
      } else {
        throw new Error(`Invalid task status: ${status}`);
      }
    }
    
    // Update with the valid status
    return this.update(id, { status: status as FormTaskStatus });
  }

  /**
   * Delete a task (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Get the existing task
      const existingTask = await this.getById(id);
      if (!existingTask) {
        throw new Error(`Task with id ${id} not found`);
      }
      
      // Mark as deleted and update timestamp
      const now = new Date().toISOString();
      await this.localAdapter.update(id, {
        is_deleted: true,
        updated_at: now,
        _is_synced: false,
        _sync_status: 'pending',
        _local_updated_at: now
      } as Task);
      
      // If online, also update remote
      if (this.networkStatus.isOnline()) {
        try {
          await this.remoteAdapter.update(id, {
            is_deleted: true,
            updated_at: now
          });
          
          // Mark as synced
          await this.localAdapter.update(id, {
            _is_synced: true,
            _sync_status: 'synced'
          } as Task);
        } catch (error) {
          console.error(`Error deleting task ${id} remotely:`, error);
          // Continue with local delete even if remote fails
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting task ${id}:`, error);
      throw error;
    }
  }

  /**
   * Hard delete a task (permanent removal)
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      // Delete locally
      await this.localAdapter.delete(id);
      
      // If online, also delete remotely
      if (this.networkStatus.isOnline()) {
        try {
          await this.remoteAdapter.delete(id);
        } catch (error) {
          console.error(`Error hard deleting task ${id} remotely:`, error);
          // Continue even if remote fails
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error hard deleting task ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check if there are pending changes to sync
   * Implemented to satisfy IOfflineCapableRepository interface
   */
  async hasPendingChanges(): Promise<boolean> {
    return this.hasUnsyncedChanges();
  }
  
  /**
   * Check if there are unsynchronized changes
   */
  async hasUnsyncedChanges(): Promise<boolean> {
    const tasks = await this.localAdapter.getAll();
    return tasks.some(task => task._is_synced === false);
  }

  /**
   * Force reload data from remote storage
   */
  async forceRefresh(): Promise<void> {
    if (!this.networkStatus.isOnline()) {
      throw new Error('Cannot refresh while offline');
    }
    
    try {
      // Get all remote items
      const remoteTasks = await this.remoteAdapter.getAll();
      
      // Clear local storage
      const localTasks = await this.localAdapter.getAll();
      
      // Only delete synced tasks to avoid losing local changes
      for (const localTask of localTasks) {
        if (localTask._is_synced) {
          await this.localAdapter.delete(localTask.id);
        }
      }
      
      // Save all remote items locally
      for (const remoteTask of remoteTasks) {
        await this.localAdapter.create({
          ...remoteTask,
          _is_synced: true,
          _sync_status: 'synced',
          _local_updated_at: new Date().toISOString()
        } as Task);
      }
    } catch (error) {
      console.error('Error during force refresh:', error);
      throw error;
    }
  }

  /**
   * Sync local and remote data
   */
  async sync(): Promise<void> {
    // Prevent multiple simultaneous syncs
    if (this.syncInProgress || !this.networkStatus.isOnline()) {
      return;
    }
    
    try {
      this.syncInProgress = true;
      
      // Get all tasks from local
      const localTasks = await this.localAdapter.getAll();
      
      // Get unsynced local tasks
      const unsyncedTasks = localTasks.filter(task => task._is_synced === false);
      
      // Process each unsynced task
      for (const task of unsyncedTasks) {
        try {
          if (task.is_deleted) {
            // If marked for deletion, delete remotely or update
            if (task.id.startsWith('local-')) {
              // Local-only item, just remove it
              await this.localAdapter.delete(task.id);
            } else {
              // Remote item, update remote then mark as synced
              await this.remoteAdapter.update(task.id, {
                is_deleted: true,
                updated_at: task.updated_at
              });
              
              await this.localAdapter.update(task.id, {
                _is_synced: true,
                _sync_status: 'synced'
              } as Task);
            }
          } else if (task.id.startsWith('local-')) {
            // New local task that needs to be created remotely
            const remoteTask = await this.remoteAdapter.create({
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              due_date: task.due_date,
              estimated_time: task.estimated_time,
              actual_time: task.actual_time,
              tags: task.tags,
              created_at: task.created_at,
              updated_at: task.updated_at,
              created_by: task.created_by,
              is_deleted: task.is_deleted,
              list_id: task.list_id,
              category_name: task.category_name
            });
            
            // Delete the local-only task
            await this.localAdapter.delete(task.id);
            
            // Create a new synced task with the remote ID
            await this.localAdapter.create({
              ...remoteTask,
              _is_synced: true,
              _sync_status: 'synced',
              _local_updated_at: new Date().toISOString()
            } as Task);
          } else {
            // Existing task that needs to be updated remotely
            await this.remoteAdapter.update(task.id, {
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              due_date: task.due_date,
              estimated_time: task.estimated_time,
              actual_time: task.actual_time,
              tags: task.tags,
              updated_at: task.updated_at,
              is_deleted: task.is_deleted,
              list_id: task.list_id,
              category_name: task.category_name
            });
            
            // Mark as synced
            await this.localAdapter.update(task.id, {
              _is_synced: true,
              _sync_status: 'synced'
            } as Task);
          }
        } catch (error) {
          console.error(`Error syncing task ${task.id}:`, error);
          // Update sync status to failed
          await this.localAdapter.update(task.id, {
            _sync_status: 'failed',
            _sync_error: String(error)
          } as Task);
        }
      }
      
      // Get the latest tasks from remote
      const remoteTasks = await this.remoteAdapter.getAll();
      
      // Process remote tasks
      for (const remoteTask of remoteTasks) {
        const localTask = localTasks.find(t => t.id === remoteTask.id);
        
        if (!localTask) {
          // New remote task, add to local
          await this.localAdapter.create({
            ...remoteTask,
            _is_synced: true,
            _sync_status: 'synced',
            _local_updated_at: new Date().toISOString()
          } as Task);
        } else if (localTask._is_synced) {
          // Local is synced, update with remote changes
          // Compare updated_at times to see which is newer
          const remoteDate = new Date(remoteTask.updated_at || 0);
          const localDate = new Date(localTask.updated_at || 0);
          
          if (remoteDate > localDate) {
            // Remote is newer, update local
            await this.localAdapter.update(remoteTask.id, {
              ...remoteTask,
              _is_synced: true,
              _sync_status: 'synced',
              _local_updated_at: new Date().toISOString()
            } as Task);
          }
        }
      }
      
    } catch (error) {
      console.error('Error syncing tasks:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }
}

// Create singleton instance
export const taskRepository = new TaskRepository();
