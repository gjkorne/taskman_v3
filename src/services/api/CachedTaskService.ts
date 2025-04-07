import { Task, TaskStatusType } from '../../types/task';
import { ITaskService } from '../interfaces/ITaskService';
import { TaskCreateDTO, TaskUpdateDTO } from '../../repositories/taskRepository';
import { ServiceFactory } from '../factory/ServiceFactory';
import { CacheService } from '../../core/cache/CacheService';
import { CacheStorageType, CacheExpirationStrategy } from '../../core/cache/CacheTypes';
import { NetworkError } from '../error/ErrorTypes';
import { timeSessionsService } from './timeSessionsService';
import { determineStatusFromSessions } from '../../utils/taskStatusUtils';

/**
 * Cache-enhanced Task Service that wraps the regular TaskService
 * Implements the offline-first pattern with transparent caching
 */
export class CachedTaskService implements ITaskService {
  private taskService: ITaskService;
  private cache;
  private readonly CACHE_TTL = 1000 * 60 * 15; // 15 minutes
  
  // Event handlers map
  private eventHandlers: Record<string, Function[]> = {};
  
  /**
   * Create a new CachedTaskService that wraps a TaskService instance
   */
  constructor(taskService?: ITaskService) {
    // Use provided service or get from factory
    this.taskService = taskService || 
      ServiceFactory.getService('TaskService') as ITaskService;
    
    // Initialize cache
    this.cache = CacheService.getInstance().getCache<any>({
      name: 'tasks',
      storageType: CacheStorageType.LOCAL_STORAGE,
      expirationStrategy: CacheExpirationStrategy.TIME_BASED,
      ttlMs: this.CACHE_TTL,
      serialize: true
    });
    
    // Subscribe to task service events
    this.setupEventHandlers();
  }
  
  /**
   * Subscribe to original service events to keep cache in sync
   */
  private setupEventHandlers() {
    // When tasks are updated externally, refresh our cache
    this.taskService.on('tasks-changed', () => {
      this.refreshTasks();
    });
    
    // When tasks are loaded directly, update our cache
    this.taskService.on('tasks-loaded', (tasks: Task[]) => {
      this.cache.set('all_tasks', tasks);
    });
    
    // When a task is created, update the cache
    this.taskService.on('task-created', (task: Task) => {
      this.updateTaskInCache(task);
    });
    
    // When a task is updated, update the cache
    this.taskService.on('task-updated', (task: Task) => {
      this.updateTaskInCache(task);
    });
    
    // When a task is deleted, update the cache
    this.taskService.on('task-deleted', (taskId: string) => {
      this.removeTaskFromCache(taskId);
    });
  }
  
  /**
   * Add a new task to the cache or update an existing one
   */
  private async updateTaskInCache(task: Task): Promise<void> {
    try {
      // Update the individual task cache
      await this.cache.set(`task_${task.id}`, task);
      
      // Update the task in the all_tasks cache if it exists
      const cachedTasks = await this.cache.get('all_tasks');
      if (cachedTasks.success && cachedTasks.data) {
        const tasks = cachedTasks.data as Task[];
        const updatedTasks = tasks.map(t => t.id === task.id ? task : t);
        
        // If the task wasn't in the list, add it
        if (!updatedTasks.some(t => t.id === task.id)) {
          updatedTasks.push(task);
        }
        
        await this.cache.set('all_tasks', updatedTasks);
      }
    } catch (error) {
      console.error('Error updating task in cache', error);
    }
  }
  
  /**
   * Remove a task from cache
   */
  private async removeTaskFromCache(taskId: string): Promise<void> {
    try {
      // Remove the individual task cache
      await this.cache.remove(`task_${taskId}`);
      
      // Remove the task from the all_tasks cache if it exists
      const cachedTasks = await this.cache.get('all_tasks');
      if (cachedTasks.success && cachedTasks.data) {
        const tasks = cachedTasks.data as Task[];
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        await this.cache.set('all_tasks', updatedTasks);
      }
    } catch (error) {
      console.error('Error removing task from cache', error);
    }
  }
  
  /**
   * Get all tasks, using cache when offline or for better performance
   */
  async getTasks(): Promise<Task[]> {
    try {
      // Try to get from cache first (offline-first approach)
      const cachedResult = await this.cache.get('all_tasks');
      
      if (cachedResult.success && cachedResult.data) {
        // Return cached data and refresh in background if it's stale
        if (this.isStaleCache(cachedResult.metadata?.lastAccessedAt)) {
          this.refreshTasksInBackground();
        }
        
        // Emit the event
        this.emit('tasks-loaded', cachedResult.data);
        return cachedResult.data;
      }
      
      // No cache or cache failed, try to get from service
      return this.refreshTasks();
    } catch (error) {
      // Handle offline state or other errors
      if (error instanceof NetworkError) {
        // Try to get from cache as a fallback
        const cachedResult = await this.cache.get('all_tasks');
        if (cachedResult.success && cachedResult.data) {
          return cachedResult.data;
        }
      }
      
      // Re-throw the error if we can't recover
      throw error;
    }
  }
  
  /**
   * Refresh tasks from the server and update cache
   */
  async refreshTasks(): Promise<Task[]> {
    try {
      const tasks = await this.taskService.getTasks();
      
      // Update cache with fresh data
      await this.cache.set('all_tasks', tasks, {
        offlineAccessed: false,
        needsSync: false
      });
      
      // Emit the event
      this.emit('tasks-loaded', tasks);
      
      // Check and update status based on sessions
      await this.updateTaskStatusesBasedOnSessions(tasks);
      
      return tasks;
    } catch (error) {
      // Handle error but don't invalidate cache
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Refresh tasks in the background without blocking
   */
  private refreshTasksInBackground(): void {
    this.refreshTasks().catch(error => {
      console.error('Background task refresh failed', error);
    });
  }
  
  /**
   * Check if cache is stale and should be refreshed
   */
  private isStaleCache(lastAccessedAt?: string): boolean {
    if (!lastAccessedAt) return true;
    
    const now = new Date();
    const lastAccessed = new Date(lastAccessedAt);
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    return now.getTime() - lastAccessed.getTime() > staleThreshold;
  }
  
  /**
   * Get a task by ID, using cache when possible
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      // Try to get from cache first
      const cacheKey = `task_${id}`;
      const cachedResult = await this.cache.get(cacheKey);
      
      if (cachedResult.success && cachedResult.data) {
        // Return cached data and refresh in background if it's stale
        if (this.isStaleCache(cachedResult.metadata?.lastAccessedAt)) {
          this.refreshTaskByIdInBackground(id);
        }
        
        return cachedResult.data;
      }
      
      // No cache or cache failed, get from service
      const task = await this.taskService.getTaskById(id);
      
      if (task) {
        // Update cache
        await this.cache.set(cacheKey, task);
      }
      
      return task;
    } catch (error) {
      // Handle offline state
      if (error instanceof NetworkError) {
        // Try to get from cache as a fallback
        const cachedResult = await this.cache.get(`task_${id}`);
        if (cachedResult.success && cachedResult.data) {
          return cachedResult.data;
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Refresh a single task in the background
   */
  private refreshTaskByIdInBackground(id: string): void {
    this.taskService.getTaskById(id)
      .then(task => {
        if (task) {
          this.cache.set(`task_${id}`, task);
        }
      })
      .catch(error => {
        console.error(`Background task refresh failed for task ${id}`, error);
      });
  }
  
  /**
   * Create a new task
   */
  async createTask(taskData: TaskCreateDTO): Promise<Task | null> {
    try {
      // Create task in the service
      const task = await this.taskService.createTask(taskData);
      
      if (task) {
        // Update cache
        await this.updateTaskInCache(task);
        
        // Emit event
        this.emit('task-created', task);
      }
      
      return task;
    } catch (error) {
      // Handle offline mode - store for later sync
      if (error instanceof NetworkError) {
        // In a real implementation, you'd queue this for later sync
        // This is simplified for demonstration
        console.warn('Task creation queued for later sync (offline mode)');
        this.emit('error', error);
      } else {
        this.emit('error', error);
        throw error;
      }
      
      return null;
    }
  }
  
  /**
   * Update an existing task
   */
  async updateTask(id: string, taskData: TaskUpdateDTO): Promise<Task | null> {
    try {
      // Update in the service
      const task = await this.taskService.updateTask(id, taskData);
      
      if (task) {
        // Update cache
        await this.updateTaskInCache(task);
        
        // Emit event
        this.emit('task-updated', task);
      }
      
      return task;
    } catch (error) {
      // Handle offline mode
      if (error instanceof NetworkError) {
        // Try to update locally for now, queue for later sync
        try {
          const cachedTask = await this.getTaskById(id);
          if (cachedTask) {
            const updatedTask = { ...cachedTask, ...taskData, updated_at: new Date().toISOString() };
            await this.cache.set(`task_${id}`, updatedTask, { needsSync: true });
            
            this.emit('task-updated', updatedTask);
            return updatedTask;
          }
        } catch (innerError) {
          console.error('Failed to update task in offline mode', innerError);
        }
      }
      
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      // Delete from the service
      const success = await this.taskService.deleteTask(id);
      
      if (success) {
        // Update cache
        await this.removeTaskFromCache(id);
        
        // Emit event
        this.emit('task-deleted', id);
      }
      
      return success;
    } catch (error) {
      // Handle offline mode
      if (error instanceof NetworkError) {
        // Mark as deleted locally, queue for later sync
        try {
          const cachedTask = await this.getTaskById(id);
          if (cachedTask) {
            // Mark as deleted in cache, but keep for sync purposes
            const deletedTask = { ...cachedTask, is_deleted: true, updated_at: new Date().toISOString() };
            await this.cache.set(`task_${id}`, deletedTask, { needsSync: true });
            
            // Remove from the all tasks list
            await this.removeTaskFromCache(id);
            
            this.emit('task-deleted', id);
            return true;
          }
        } catch (innerError) {
          console.error('Failed to delete task in offline mode', innerError);
        }
      }
      
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Update a task's status
   */
  async updateTaskStatus(id: string, status: TaskStatusType): Promise<Task | null> {
    return this.updateTask(id, { status });
  }
  
  /**
   * Start a task (change status to active)
   */
  async startTask(id: string): Promise<Task | null> {
    return this.updateTask(id, { status: 'active' as TaskStatusType });
  }
  
  /**
   * Complete a task (change status to completed)
   */
  async completeTask(id: string): Promise<Task | null> {
    return this.updateTask(id, { status: 'completed' as TaskStatusType });
  }
  
  /**
   * Check if there are any unsynchronized changes
   */
  async hasUnsyncedChanges(): Promise<boolean> {
    try {
      // Get all cache entries and check for needsSync metadata
      const allTasks = await this.cache.get('all_tasks');
      if (allTasks.success && allTasks.data) {
        const tasks = allTasks.data as Task[];
        
        // Check if any task is marked as needing sync
        for (const task of tasks) {
          const cacheKey = `task_${task.id}`;
          const cachedTask = await this.cache.get(cacheKey);
          
          if (cachedTask.success && 
              cachedTask.metadata && 
              cachedTask.metadata.needsSync === true) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking for unsynced changes', error);
      return false;
    }
  }
  
  /**
   * Synchronize local changes with remote storage
   */
  async sync(): Promise<void> {
    try {
      // Get all cache entries that need synchronization
      const allTasks = await this.cache.get('all_tasks');
      if (allTasks.success && allTasks.data) {
        const tasks = allTasks.data as Task[];
        
        // Process each task that needs sync
        for (const task of tasks) {
          const cacheKey = `task_${task.id}`;
          const cachedTask = await this.cache.get(cacheKey);
          
          if (cachedTask.success && 
              cachedTask.metadata && 
              cachedTask.metadata.needsSync === true) {
            
            const taskData = cachedTask.data as Task;
            
            try {
              // Handle soft-deleted tasks
              if (taskData.is_deleted) {
                await this.taskService.deleteTask(task.id);
              } else {
                // Convert Task to TaskUpdateDTO
                const taskUpdateData: TaskUpdateDTO = {
                  title: taskData.title,
                  description: taskData.description,
                  status: taskData.status as any,
                  priority: taskData.priority as any,
                  tags: taskData.tags || [],
                  listId: taskData.list_id,
                  category: taskData.category_name,
                  isDeleted: taskData.is_deleted
                };
                
                // Update existing task
                await this.taskService.updateTask(task.id, taskUpdateData);
                
                // Update cache to indicate sync is complete
                await this.cache.set(cacheKey, taskData, { 
                  needsSync: false,
                  offlineAccessed: false 
                });
              }
            } catch (syncError) {
              console.error(`Failed to sync task ${task.id}`, syncError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during sync operation', error);
      throw error;
    }
  }
  
  /**
   * Force refresh all data from remote storage
   */
  async forceRefresh(): Promise<void> {
    try {
      // Get fresh data from the server
      const tasks = await this.taskService.getTasks();
      
      // Update the cache with fresh data
      await this.cache.set('all_tasks', tasks, {
        offlineAccessed: false,
        needsSync: false
      });
      
      // Update individual task caches
      for (const task of tasks) {
        await this.cache.set(`task_${task.id}`, task, {
          offlineAccessed: false,
          needsSync: false
        });
      }
      
      // Emit the event
      this.emit('tasks-loaded', tasks);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Update status for tasks based on their sessions
   * @private
   */
  private async updateTaskStatusesBasedOnSessions(tasks: Task[]): Promise<void> {
    try {
      const updatedTasks: Task[] = [];
      
      // Process tasks in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        
        // Process each task in the batch
        const updates = await Promise.all(batch.map(async (task) => {
          // Skip completed or archived tasks
          if (task.status === 'completed' || task.status === 'archived') {
            return null;
          }
          
          // Get sessions for the task
          const sessions = await timeSessionsService.getSessionsByTaskId(task.id);
          const hasSessions = sessions && sessions.length > 0;
          
          // Check if any sessions are currently active (no end_time)
          const hasActiveSessions = sessions && sessions.some(session => !session.end_time);
          
          // Determine correct status
          const newStatus = determineStatusFromSessions(
            task.status as TaskStatusType, 
            hasSessions,
            hasActiveSessions
          );
          
          // Only update if status should change
          if (newStatus !== task.status) {
            const updatedTask = await this.updateTaskStatus(task.id, newStatus);
            if (updatedTask) {
              return updatedTask;
            }
          }
          return null;
        }));
        
        // Add successful updates to the list
        updatedTasks.push(...updates.filter(Boolean) as Task[]);
      }
      
      if (updatedTasks.length > 0) {
        console.log(`Updated status for ${updatedTasks.length} tasks based on sessions`);
        this.emit('tasks-changed');
      }
    } catch (error) {
      console.error('Error updating task statuses based on sessions:', error);
      // Don't throw - this is a background operation
    }
  }
  
  /**
   * Event subscription method
   */
  on(eventName: string, handler: Function): () => void {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    
    this.eventHandlers[eventName].push(handler);
    
    // Return unsubscribe function
    return () => {
      this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(h => h !== handler);
    };
  }
  
  /**
   * Unsubscribe from an event
   */
  off(eventName: string, handler: Function): void {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(h => h !== handler);
    }
  }
  
  /**
   * Emit an event
   */
  emit(eventName: string, ...args: any[]): void {
    const handlers = this.eventHandlers[eventName] || [];
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}`, error);
      }
    });
  }
}
