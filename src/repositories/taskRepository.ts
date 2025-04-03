import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { TaskSubmitData } from '../components/TaskForm/schema';
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
 * Extended Task type with offline sync properties
 */
interface OfflineTask extends Task {
  _pendingSync?: boolean;
  _lastUpdated?: string;
}

/**
 * TaskRepository - provides unified access to task data across local and remote storage
 * 
 * This repository implements offline-second architecture:
 * - Remote storage (Supabase) is the primary data source
 * - Local storage is used as a fallback when offline
 * - Changes made while offline are synced when connectivity is restored
 */
export class TaskRepository implements IOfflineCapableRepository<Task, TaskCreateDTO, TaskUpdateDTO> {
  private remoteAdapter: SupabaseAdapter<Task>;
  private localAdapter!: IndexedDBAdapter<OfflineTask>; // Using definite assignment assertion
  private networkStatus: NetworkStatusService;
  private useLocalAsBackup = false; // Flag to control whether local storage is used as a backup
  private syncInProgress = false;  // Flag to prevent multiple simultaneous syncs

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
      prepareData: (data: Partial<Task>): Record<string, any> => ({
        ...data
      })
    });
    
    // Initialize local storage adapter for backup when offline
    try {
      this.localAdapter = new IndexedDBAdapter<OfflineTask>('tasks', {
        // Same transformation options as remote adapter
        transformRow: (row: any): OfflineTask => ({
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
          category_name: row.category_name || '',
          _pendingSync: row._pendingSync,
          _lastUpdated: row._lastUpdated
        }),
        prepareData: (data: Partial<OfflineTask>): Record<string, any> => ({
          ...data
        })
      });
      
      // Test IndexedDB availability
      this.testIndexedDB();
    } catch (error) {
      console.error('Error initializing IndexedDB adapter:', error);
      this.useLocalAsBackup = false;
    }
    
    // Setup network status monitoring
    if (networkStatus) {
      this.networkStatus = networkStatus;
    } else {
      // Create a new instance of NetworkStatusService
      this.networkStatus = new NetworkStatusService();
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
      console.error('IndexedDB test failed, offline functionality will be limited:', error);
      this.useLocalAsBackup = false;
    }
  }

  /**
   * Retrieve all tasks - primarily from remote, fallback to local when offline
   */
  async getAll(): Promise<Task[]> {
    console.log('TaskRepository.getAll: Starting to fetch tasks');
    console.log('Network status:', this.networkStatus.isOnline() ? 'Online' : 'Offline');
    
    // First try to get from remote storage
    if (this.networkStatus.isOnline()) {
      try {
        console.log('TaskRepository.getAll: Attempting to fetch from remote storage');
        const remoteTasks = await this.remoteAdapter.getAll();
        console.log('TaskRepository.getAll: Successfully fetched from remote storage', remoteTasks.length, 'tasks');
        
        // If we have local storage capability, cache the results for offline use
        if (this.useLocalAsBackup) {
          console.log('TaskRepository.getAll: Caching tasks locally');
          this.cacheTasksLocally(remoteTasks).catch(error => 
            console.error('Failed to cache tasks locally:', error)
          );
        }
        
        return remoteTasks;
      } catch (error) {
        console.error('TaskRepository.getAll: Error fetching tasks from remote:', error);
        // Fall back to local storage if online fetch fails
      }
    }
    
    // If we're offline or remote fetch failed, try local storage
    if (this.useLocalAsBackup) {
      try {
        console.log('TaskRepository.getAll: Attempting to fetch from local storage');
        const localTasks = await this.localAdapter.getAll();
        console.log('TaskRepository.getAll: Successfully fetched from local storage', localTasks.length, 'tasks');
        return localTasks;
      } catch (localError) {
        console.error('TaskRepository.getAll: Error fetching from local storage:', localError);
      }
    }
    
    // If both remote and local fail, return empty array
    console.warn('TaskRepository.getAll: Unable to fetch tasks from any source');
    return [];
  }

  /**
   * Get a task by ID - try remote first, then local if offline
   */
  async getById(id: string): Promise<Task | null> {
    // Try remote first if online
    if (this.networkStatus.isOnline()) {
      try {
        const remoteTask = await this.remoteAdapter.getById(id);
        
        // Cache the task locally if found
        if (remoteTask && this.useLocalAsBackup) {
          this.localAdapter.update(id, remoteTask as OfflineTask).catch(error => 
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
        console.error(`Error fetching task ${id} from local storage:`, localError);
      }
    }
    
    // If both remote and local fail, return null
    return null;
  }

  /**
   * Create a new task
   */
  async create(data: TaskCreateDTO): Promise<Task> {
    // Format task data with timestamps
    const now = new Date().toISOString();
    const taskData: Partial<Task> = {
      ...data,
      created_at: now,
      updated_at: now
    };
    
    // If online, create in remote first (online-first approach)
    if (this.networkStatus.isOnline()) {
      try {
        const remoteTask = await this.remoteAdapter.create(taskData);
        
        // Cache in local storage if available
        if (this.useLocalAsBackup) {
          await this.localAdapter.create({
            ...remoteTask,
            _pendingSync: false,
            _lastUpdated: now
          } as OfflineTask);
        }
        
        return remoteTask;
      } catch (error) {
        console.error('Error creating task in remote storage:', error);
        // Fall back to local-only if remote fails and we're using local storage
        if (!this.useLocalAsBackup) {
          throw error; // Re-throw if local storage isn't available
        }
      }
    }
    
    // Create locally if offline or remote creation failed
    if (this.useLocalAsBackup) {
      try {
        // Generate a temporary local ID
        const localId = `local-${new Date().getTime()}-${Math.random().toString(36).slice(2, 11)}`;
        
        const localTask = await this.localAdapter.create({
          ...taskData,
          id: localId,
          _pendingSync: true,
          _lastUpdated: now
        } as OfflineTask);
        
        return localTask;
      } catch (localError) {
        console.error('Error creating task in local storage:', localError);
        throw localError;
      }
    }
    
    throw new Error('Cannot create task: both remote and local storage unavailable');
  }

  /**
   * Update an existing task
   */
  async update(id: string, data: TaskUpdateDTO): Promise<Task> {
    // Add updated timestamp
    const now = new Date().toISOString();
    const updateData: Partial<Task> = {
      ...data,
      updated_at: now
    };
    
    // If online, update remote first
    if (this.networkStatus.isOnline()) {
      try {
        const remoteTask = await this.remoteAdapter.update(id, updateData);
        
        // Update local cache if available
        if (this.useLocalAsBackup) {
          await this.localAdapter.update(id, {
            ...remoteTask,
            _pendingSync: false,
            _lastUpdated: now
          } as OfflineTask);
        }
        
        return remoteTask;
      } catch (error) {
        console.error(`Error updating task ${id} in remote storage:`, error);
        // Fall back to local-only if remote fails and we're using local storage
        if (!this.useLocalAsBackup) {
          throw error; // Re-throw if local storage isn't available
        }
      }
    }
    
    // Update locally if offline or remote update failed
    if (this.useLocalAsBackup) {
      try {
        // Get existing local task
        const existingTask = await this.localAdapter.getById(id);
        if (!existingTask) {
          throw new Error(`Task ${id} not found in local storage`);
        }
        
        const updatedTask = await this.localAdapter.update(id, {
          ...existingTask,
          ...updateData,
          _pendingSync: true,
          _lastUpdated: now
        });
        
        return updatedTask;
      } catch (localError) {
        console.error(`Error updating task ${id} in local storage:`, localError);
        throw localError;
      }
    }
    
    throw new Error('Cannot update task: both remote and local storage unavailable');
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
   * Update the status of a task
   */
  async updateStatus(taskId: string, status: TaskStatusType): Promise<Task | null> {
    // Validate the status value
    if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
      throw new Error(`Invalid status value: ${status}`);
    }
    
    // If online, update remote directly
    if (this.networkStatus.isOnline()) {
      try {
        const updatedTask = await this.remoteAdapter.update(taskId, { status });
        
        // Update local cache if we're using it
        if (this.useLocalAsBackup) {
          this.localAdapter.update(taskId, updatedTask as OfflineTask).catch(error => 
            console.error(`Failed to update task ${taskId} in local cache:`, error)
          );
        }
        
        return updatedTask;
      } catch (error) {
        console.error(`Error updating task status for ${taskId} remotely:`, error);
        // Fall back to local update if remote fails
      }
    }
    
    // If offline or remote update failed, update locally and queue for sync
    if (this.useLocalAsBackup) {
      try {
        const localTask = await this.localAdapter.getById(taskId);
        if (!localTask) {
          throw new Error(`Task ${taskId} not found in local storage`);
        }
        
        const updatedTask = await this.localAdapter.update(taskId, { 
          ...localTask, 
          status,
          _pendingSync: true,
          _lastUpdated: new Date().toISOString()
        });
        
        return updatedTask;
      } catch (localError) {
        console.error(`Error updating task ${taskId} in local storage:`, localError);
      }
    }
    
    // If both remote and local updates fail, return null
    return null;
  }

  /**
   * Delete a task (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    // First try remote deletion if online
    if (this.networkStatus.isOnline()) {
      try {
        await this.remoteAdapter.update(id, { 
          is_deleted: true,
          updated_at: new Date().toISOString() 
        });
        
        // Update local cache if available
        if (this.useLocalAsBackup) {
          const task = await this.localAdapter.getById(id);
          if (task) {
            await this.localAdapter.update(id, {
              ...task,
              is_deleted: true,
              updated_at: new Date().toISOString(),
              _pendingSync: false
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
          _pendingSync: true
        });
        
        return true;
      } catch (localError) {
        console.error(`Error deleting task ${id} from local storage:`, localError);
        throw localError;
      }
    }
    
    throw new Error('Cannot delete task: both remote and local storage unavailable');
  }

  /**
   * Sync changes between local and remote storage
   */
  async sync(): Promise<void> {
    if (!this.useLocalAsBackup || this.syncInProgress || !this.networkStatus.isOnline()) {
      return;
    }
    
    try {
      this.syncInProgress = true;
      console.log('Starting sync...');
      
      // Get all tasks with pending changes
      const localTasks = await this.localAdapter.getAll();
      const pendingTasks = localTasks.filter(task => task._pendingSync);
      
      if (pendingTasks.length === 0) {
        console.log('No pending changes to sync');
        return;
      }
      
      console.log(`Found ${pendingTasks.length} tasks with pending changes`);
      
      // Process each pending task
      for (const task of pendingTasks) {
        try {
          // Skip _pendingSync and _lastUpdated from data sent to server
          const { _pendingSync, _lastUpdated, ...taskData } = task;
          
          if (task.id.startsWith('local-')) {
            // This is a new task created offline, create it on the server
            const remoteTask = await this.remoteAdapter.create(taskData);
            
            // Delete the local temporary task
            await this.localAdapter.delete(task.id);
            
            // Create a new task with the remote ID
            await this.localAdapter.create({
              ...remoteTask,
              _pendingSync: false,
              _lastUpdated: new Date().toISOString()
            } as OfflineTask);
            
            console.log(`Created task ${task.id} -> ${remoteTask.id} on remote`);
          } else {
            // This is an existing task updated offline
            await this.remoteAdapter.update(task.id, taskData);
            
            // Update local task to mark as synced
            await this.localAdapter.update(task.id, {
              ...task,
              _pendingSync: false,
              _lastUpdated: new Date().toISOString()
            });
            
            console.log(`Updated task ${task.id} on remote`);
          }
        } catch (error) {
          console.error(`Error syncing task ${task.id}:`, error);
          // Continue with next task
        }
      }
      
      console.log('Sync completed');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
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
      const remoteTasks = await this.remoteAdapter.getAll();
      
      if (this.useLocalAsBackup) {
        // Get local tasks with pending changes to preserve them
        const localTasks = await this.localAdapter.getAll();
        const pendingTasks = localTasks.filter(task => task._pendingSync);
        
        // Create a map of pending tasks by ID
        const pendingTasksMap = new Map<string, OfflineTask>();
        pendingTasks.forEach(task => {
          if (!task.id.startsWith('local-')) {
            pendingTasksMap.set(task.id, task);
          }
        });
        
        // Update local storage
        for (const remoteTask of remoteTasks) {
          const pendingTask = pendingTasksMap.get(remoteTask.id);
          
          if (pendingTask) {
            // Keep the pending task (don't overwrite with remote)
            continue;
          }
          
          // Update or create the task locally
          const existing = await this.localAdapter.getById(remoteTask.id);
          if (existing) {
            await this.localAdapter.update(remoteTask.id, {
              ...remoteTask,
              _pendingSync: false,
              _lastUpdated: new Date().toISOString()
            } as OfflineTask);
          } else {
            await this.localAdapter.create({
              ...remoteTask,
              _pendingSync: false,
              _lastUpdated: new Date().toISOString()
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
   * Checks if there are pending changes that need to be synced
   */
  async hasPendingChanges(): Promise<boolean> {
    if (!this.useLocalAsBackup) {
      return false;
    }
    
    try {
      const localTasks = await this.localAdapter.getAll();
      return localTasks.some(task => task._pendingSync === true);
    } catch (error) {
      console.error('Error checking for pending changes:', error);
      return false;
    }
  }
}

// Create singleton instance
export const taskRepository = new TaskRepository();
