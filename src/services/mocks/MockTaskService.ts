import { 
  ITaskService, 
  TaskServiceEvents 
} from '../interfaces/ITaskService';
import { 
  Task, 
  TaskStatus, 
  TaskStatusType,
  TaskPriority 
} from '../../types/task';
import { 
  TaskCreateDTO, 
  TaskUpdateDTO 
} from '../../repositories/taskRepository';
import { ServiceError } from '../BaseService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock implementation of the TaskService for testing
 * This allows tests to control task behavior and verify task operations
 */
export class MockTaskService implements ITaskService {
  // In-memory task storage
  private tasks: Task[] = [];
  
  // Track method calls for assertions
  methodCalls: Record<string, any[]> = {
    getTasks: [],
    getTaskById: [],
    createTask: [],
    updateTask: [],
    deleteTask: [],
    updateTaskStatus: [],
    refreshTasks: [],
    startTask: [],
    completeTask: [],
    hasUnsyncedChanges: [],
    syncChanges: [],
    on: [],
    off: [],
    emit: [],
    initialize: []
  };
  
  // Mock return values for various methods
  mockReturnValues: Record<string, any> = {};
  
  // Event handlers
  private eventHandlers: Partial<Record<keyof TaskServiceEvents, Array<(data: any) => void>>> = {};
  
  // Network status simulation
  private _isOffline: boolean = false;
  
  // Sync status simulation
  private _hasUnsyncedChanges: boolean = false;
  
  /**
   * Create a new MockTaskService with optional initial tasks
   */
  constructor(initialTasks: Task[] = []) {
    this.tasks = [...initialTasks];
  }
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    this.methodCalls.initialize.push({});
    
    if (this.mockReturnValues.initialize instanceof Error) {
      return Promise.reject(this.mockReturnValues.initialize);
    }
    
    return Promise.resolve();
  }
  
  /**
   * Get all tasks
   */
  async getTasks(): Promise<Task[]> {
    this.methodCalls.getTasks.push({});
    
    if (this.mockReturnValues.getTasks instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTasks);
    }
    
    if (this.mockReturnValues.getTasks) {
      return Promise.resolve(this.mockReturnValues.getTasks);
    }
    
    // Default behavior: return non-deleted tasks
    return Promise.resolve(this.tasks.filter(task => !task.is_deleted));
  }
  
  /**
   * Get a task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    this.methodCalls.getTaskById.push({ id });
    
    if (this.mockReturnValues.getTaskById instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTaskById);
    }
    
    if (this.mockReturnValues.getTaskById !== undefined) {
      return Promise.resolve(this.mockReturnValues.getTaskById);
    }
    
    // Default behavior: find by ID
    const task = this.tasks.find(t => t.id === id && !t.is_deleted);
    return Promise.resolve(task || null);
  }
  
  /**
   * Create a new task
   */
  async createTask(taskData: TaskCreateDTO): Promise<Task | null> {
    this.methodCalls.createTask.push({ taskData });
    
    if (this.mockReturnValues.createTask instanceof Error) {
      return Promise.reject(this.mockReturnValues.createTask);
    }
    
    if (this.mockReturnValues.createTask !== undefined) {
      return Promise.resolve(this.mockReturnValues.createTask);
    }
    
    // Default behavior: create a new task
    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || TaskStatus.PENDING,
      priority: taskData.priority || TaskPriority.MEDIUM,
      due_date: taskData.due_date || null,
      estimated_time: taskData.estimated_time || null,
      actual_time: null,
      tags: taskData.tags || null,
      created_at: now,
      updated_at: now,
      created_by: 'mock-user',
      is_deleted: false,
      list_id: taskData.list_id || null,
      category_name: taskData.category_name || null,
      notes: taskData.notes || null,
      checklist_items: taskData.checklist_items || null,
      note_type: taskData.note_type || null,
      _is_synced: !this._isOffline,
      _sync_status: this._isOffline ? 'pending' : 'synced'
    };
    
    this.tasks.push(newTask);
    
    // Emit task created event
    this.emit('task-created', newTask);
    this.emit('tasks-changed');
    
    // Track sync changes if offline
    if (this._isOffline) {
      this._hasUnsyncedChanges = true;
    }
    
    return Promise.resolve(newTask);
  }
  
  /**
   * Update an existing task
   */
  async updateTask(id: string, taskData: TaskUpdateDTO): Promise<Task | null> {
    this.methodCalls.updateTask.push({ id, taskData });
    
    if (this.mockReturnValues.updateTask instanceof Error) {
      return Promise.reject(this.mockReturnValues.updateTask);
    }
    
    if (this.mockReturnValues.updateTask !== undefined) {
      return Promise.resolve(this.mockReturnValues.updateTask);
    }
    
    // Default behavior: update an existing task
    const taskIndex = this.tasks.findIndex(t => t.id === id && !t.is_deleted);
    
    if (taskIndex === -1) {
      return Promise.resolve(null);
    }
    
    const updatedTask: Task = {
      ...this.tasks[taskIndex],
      ...taskData,
      updated_at: new Date().toISOString(),
      _is_synced: !this._isOffline,
      _sync_status: this._isOffline ? 'pending' : 'synced'
    };
    
    this.tasks[taskIndex] = updatedTask;
    
    // Emit task updated event
    this.emit('task-updated', updatedTask);
    this.emit('tasks-changed');
    
    // Track sync changes if offline
    if (this._isOffline) {
      this._hasUnsyncedChanges = true;
    }
    
    return Promise.resolve(updatedTask);
  }
  
  /**
   * Delete a task (soft delete)
   */
  async deleteTask(id: string): Promise<boolean> {
    this.methodCalls.deleteTask.push({ id });
    
    if (this.mockReturnValues.deleteTask instanceof Error) {
      return Promise.reject(this.mockReturnValues.deleteTask);
    }
    
    if (this.mockReturnValues.deleteTask !== undefined) {
      return Promise.resolve(this.mockReturnValues.deleteTask);
    }
    
    // Default behavior: soft delete
    const taskIndex = this.tasks.findIndex(t => t.id === id && !t.is_deleted);
    
    if (taskIndex === -1) {
      return Promise.resolve(false);
    }
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      is_deleted: true,
      updated_at: new Date().toISOString(),
      _is_synced: !this._isOffline,
      _sync_status: this._isOffline ? 'pending' : 'synced'
    };
    
    // Emit task deleted event
    this.emit('task-deleted', id);
    this.emit('tasks-changed');
    
    // Track sync changes if offline
    if (this._isOffline) {
      this._hasUnsyncedChanges = true;
    }
    
    return Promise.resolve(true);
  }
  
  /**
   * Update a task's status
   */
  async updateTaskStatus(id: string, status: TaskStatusType): Promise<Task | null> {
    this.methodCalls.updateTaskStatus.push({ id, status });
    
    if (this.mockReturnValues.updateTaskStatus instanceof Error) {
      return Promise.reject(this.mockReturnValues.updateTaskStatus);
    }
    
    if (this.mockReturnValues.updateTaskStatus !== undefined) {
      return Promise.resolve(this.mockReturnValues.updateTaskStatus);
    }
    
    // Default behavior: update status
    return this.updateTask(id, { status });
  }
  
  /**
   * Refresh all tasks from the data source
   */
  async refreshTasks(): Promise<Task[]> {
    this.methodCalls.refreshTasks.push({});
    
    if (this.mockReturnValues.refreshTasks instanceof Error) {
      return Promise.reject(this.mockReturnValues.refreshTasks);
    }
    
    if (this.mockReturnValues.refreshTasks) {
      return Promise.resolve(this.mockReturnValues.refreshTasks);
    }
    
    // Default behavior: just return current tasks
    const tasks = this.tasks.filter(task => !task.is_deleted);
    
    // Emit tasks loaded event
    this.emit('tasks-loaded', tasks);
    
    return Promise.resolve(tasks);
  }
  
  /**
   * Start a task (change status to ACTIVE)
   */
  async startTask(id: string): Promise<Task | null> {
    this.methodCalls.startTask.push({ id });
    
    if (this.mockReturnValues.startTask instanceof Error) {
      return Promise.reject(this.mockReturnValues.startTask);
    }
    
    if (this.mockReturnValues.startTask !== undefined) {
      return Promise.resolve(this.mockReturnValues.startTask);
    }
    
    // Default behavior: set status to active
    return this.updateTaskStatus(id, TaskStatus.ACTIVE);
  }
  
  /**
   * Complete a task (change status to COMPLETED)
   */
  async completeTask(id: string): Promise<Task | null> {
    this.methodCalls.completeTask.push({ id });
    
    if (this.mockReturnValues.completeTask instanceof Error) {
      return Promise.reject(this.mockReturnValues.completeTask);
    }
    
    if (this.mockReturnValues.completeTask !== undefined) {
      return Promise.resolve(this.mockReturnValues.completeTask);
    }
    
    // Default behavior: set status to completed
    return this.updateTaskStatus(id, TaskStatus.COMPLETED);
  }
  
  /**
   * Check if there are unsynchronized changes
   */
  async hasUnsyncedChanges(): Promise<boolean> {
    this.methodCalls.hasUnsyncedChanges.push({});
    
    if (this.mockReturnValues.hasUnsyncedChanges !== undefined) {
      return Promise.resolve(this.mockReturnValues.hasUnsyncedChanges);
    }
    
    return Promise.resolve(this._hasUnsyncedChanges);
  }
  
  /**
   * Synchronize local changes with remote storage
   */
  async syncChanges(): Promise<void> {
    this.methodCalls.syncChanges.push({});
    
    if (this.mockReturnValues.syncChanges instanceof Error) {
      return Promise.reject(this.mockReturnValues.syncChanges);
    }
    
    // Default behavior: simulate sync
    if (!this._isOffline) {
      this._hasUnsyncedChanges = false;
      
      // Set all tasks as synced
      this.tasks = this.tasks.map(task => ({
        ...task,
        _is_synced: true,
        _sync_status: 'synced'
      }));
    }
    
    return Promise.resolve();
  }
  
  /**
   * Subscribe to service events
   */
  on<K extends keyof TaskServiceEvents>(
    event: K, 
    callback: (data: TaskServiceEvents[K]) => void
  ): () => void {
    this.methodCalls.on.push({ event, callback });
    
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event]!.push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  /**
   * Unsubscribe from service events
   */
  off<K extends keyof TaskServiceEvents>(
    event: K, 
    callback: (data: TaskServiceEvents[K]) => void
  ): void {
    this.methodCalls.off.push({ event, callback });
    
    if (!this.eventHandlers[event]) {
      return;
    }
    
    const index = this.eventHandlers[event]!.indexOf(callback as any);
    if (index !== -1) {
      this.eventHandlers[event]!.splice(index, 1);
    }
  }
  
  /**
   * Emit an event with data
   */
  emit<K extends keyof TaskServiceEvents>(
    event: K, 
    data?: TaskServiceEvents[K]
  ): void {
    this.methodCalls.emit.push({ event, data });
    
    if (!this.eventHandlers[event]) {
      return;
    }
    
    for (const handler of this.eventHandlers[event]!) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
        
        // Emit error event
        if (event !== 'error') {
          const serviceError = new ServiceError(
            'event_handler_error',
            `Error in ${String(event)} event handler`,
            { originalError: error }
          );
          this.emit('error', serviceError);
        }
      }
    }
  }
  
  /**
   * Simulate going offline
   */
  simulateOffline(offline: boolean = true): void {
    this._isOffline = offline;
  }
  
  /**
   * Simulate unsynchronized changes
   */
  simulateUnsyncedChanges(hasChanges: boolean = true): void {
    this._hasUnsyncedChanges = hasChanges;
  }
  
  /**
   * Reset the mock service state
   */
  reset(initialTasks: Task[] = []): void {
    this.tasks = [...initialTasks];
    this._isOffline = false;
    this._hasUnsyncedChanges = false;
    this.mockReturnValues = {};
    
    // Reset method call tracking
    Object.keys(this.methodCalls).forEach(method => {
      this.methodCalls[method] = [];
    });
    
    // Clear event handlers
    this.eventHandlers = {};
  }
  
  /**
   * Set a mock return value for a method
   */
  mockMethod(methodName: string, returnValue: any): void {
    this.mockReturnValues[methodName] = returnValue;
  }
  
  /**
   * Simulate task error
   */
  simulateError(errorCode: string, message: string, context?: any): void {
    const error = new ServiceError(errorCode, message, context);
    this.emit('error', error);
  }
  
  /**
   * Helper to get tasks in a specific status
   */
  getTasksByStatus(status: TaskStatusType): Task[] {
    return this.tasks.filter(task => 
      task.status === status && !task.is_deleted
    );
  }
  
  /**
   * Helper to set all tasks at once - useful for test setup
   */
  setTasks(tasks: Task[]): void {
    this.tasks = [...tasks];
  }
}
