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
import { ServiceErrorImpl } from '../error/ServiceError';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock implementation of the TaskService for testing
 * This allows tests to control task behavior and verify task operations
 */
export class MockTaskService implements ITaskService {
  private tasks: Task[] = [];
  private eventCallbacks: Map<string, Set<Function>> = new Map();
  private _isOffline: boolean = false;
  
  // Track method calls for testing
  methodCalls: {
    getTasks: any[];
    getTaskById: any[];
    createTask: any[];
    updateTask: any[];
    deleteTask: any[];
    completeTask: any[];
    updateTaskStatus: any[];
    getTasksByStatus: any[];
    getTasksByProject: any[];
    getTasksByCategory: any[];
    getTasksForToday: any[];
    getTasksForWeek: any[];
    getFilteredTasks: any[];
    on: any[];
    off: any[];
    emit: any[];
    initialize: any[];
    sync: any[];
    forceRefresh: any[];
    refreshTasks: any[];
    startTask: any[];
    [key: string]: any[]; // Add index signature
  } = {
    getTasks: [],
    getTaskById: [],
    createTask: [],
    updateTask: [],
    deleteTask: [],
    completeTask: [],
    updateTaskStatus: [],
    getTasksByStatus: [],
    getTasksByProject: [],
    getTasksByCategory: [],
    getTasksForToday: [],
    getTasksForWeek: [],
    getFilteredTasks: [],
    on: [],
    off: [],
    emit: [],
    initialize: [],
    sync: [],
    forceRefresh: [],
    refreshTasks: [],
    startTask: []
  };
  
  // Mock return values for various methods
  mockReturnValues: {
    [key: string]: any;
  } = {};
  
  // Sync status simulation
  private _hasUnsyncedChanges: boolean = false;
  
  // Simulated latency
  private _simulatedLatency: number = 0;
  
  // Fail next operation
  private _failNextOperation: boolean = false;
  
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
    // Nothing to do for the mock implementation
    this.methodCalls.initialize.push({});
    return Promise.resolve();
  }
  
  /**
   * Check if there are unsynchronized changes
   */
  async hasUnsyncedChanges(): Promise<boolean> {
    return this._hasUnsyncedChanges;
  }
  
  /**
   * Get all tasks
   */
  async getTasks(): Promise<Task[]> {
    this.methodCalls.getTasks.push({});
    
    // Simulate network latency
    if (this._simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this._simulatedLatency));
    }
    
    // Emit loading event - use type assertion to avoid TypeScript error
    this.emit('loading' as unknown as keyof TaskServiceEvents, true as any);
    
    // Fail if next operation should fail
    if (this._failNextOperation) {
      this._failNextOperation = false;
      this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
      this.emit('error', new ServiceErrorImpl('mock_error', 'Simulated task fetch error'));
      throw new Error('Simulated task fetch error');
    }
    
    if (this.mockReturnValues.getTasks instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTasks);
    }
    
    if (this.mockReturnValues.getTasks) {
      return Promise.resolve(this.mockReturnValues.getTasks);
    }
    
    // Default behavior: return non-deleted tasks
    const activeTasks = this.tasks.filter(task => !task.is_deleted);
    this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
    return [...activeTasks];
  }
  
  /**
   * Get a task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    this.methodCalls.getTaskById.push({ id });
    
    if (this.mockReturnValues.getTaskById instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTaskById);
    }
    
    if (this.mockReturnValues.getTaskById) {
      return Promise.resolve(this.mockReturnValues.getTaskById);
    }
    
    // Default behavior: find task by ID
    const task = this.tasks.find(t => t.id === id && !t.is_deleted);
    return Promise.resolve(task || null);
  }
  
  /**
   * Create a new task
   */
  async createTask(taskData: TaskCreateDTO): Promise<Task | null> {
    this.methodCalls.createTask.push({ taskData });
    
    // Simulate network latency
    if (this._simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this._simulatedLatency));
    }
    
    // Emit loading event
    this.emit('loading' as unknown as keyof TaskServiceEvents, true as any);
    
    // Fail if next operation should fail
    if (this._failNextOperation) {
      this._failNextOperation = false;
      this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
      this.emit('error', new ServiceErrorImpl('mock_error', 'Simulated task creation error'));
      throw new Error('Simulated task creation error');
    }
    
    if (this.mockReturnValues.createTask instanceof Error) {
      return Promise.reject(this.mockReturnValues.createTask);
    }
    
    if (this.mockReturnValues.createTask) {
      return Promise.resolve(this.mockReturnValues.createTask);
    }
    
    // Default behavior: create a new task
    const now = new Date().toISOString();
    
    // Create a new task with the data provided
    // Map field names from TaskSubmitData to Task
    const newTask = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || TaskStatus.PENDING,
      priority: taskData.priority || TaskPriority.MEDIUM,
      // Map to database field names
      due_date: taskData.dueDate || null,
      estimated_time: taskData.estimatedTime || null,
      actual_time: null,
      tags: taskData.tags || [],
      created_at: now,
      updated_at: now,
      created_by: taskData.created_by || 'mock-user',
      is_deleted: taskData.isDeleted || false,
      list_id: taskData.listId || null,
      category_name: taskData.category || null,
      // Use undefined instead of null for category to match Task type
      category: taskData.category || undefined,
      // Additional fields not in TaskSubmitData but required for the database
      _is_synced: !this._isOffline,
      _sync_status: this._isOffline ? 'pending' : 'synced'
    } as Task;
    
    this.tasks.push(newTask);
    
    // Emit task created event
    this.emit('task-created', newTask);
    this.emit('tasks-changed');
    
    // Track sync changes if offline
    if (this._isOffline) {
      this._hasUnsyncedChanges = true;
    }
    
    this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
    return newTask;
  }
  
  /**
   * Update an existing task
   */
  async updateTask(id: string, taskData: TaskUpdateDTO): Promise<Task | null> {
    this.methodCalls.updateTask.push({ id, taskData });
    
    // Simulate network latency
    if (this._simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this._simulatedLatency));
    }
    
    // Emit loading event
    this.emit('loading' as unknown as keyof TaskServiceEvents, true as any);
    
    // Fail if next operation should fail
    if (this._failNextOperation) {
      this._failNextOperation = false;
      this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
      this.emit('error', new ServiceErrorImpl('mock_error', 'Simulated task update error'));
      throw new Error('Simulated task update error');
    }
    
    if (this.mockReturnValues.updateTask instanceof Error) {
      return Promise.reject(this.mockReturnValues.updateTask);
    }
    
    if (this.mockReturnValues.updateTask) {
      return Promise.resolve(this.mockReturnValues.updateTask);
    }
    
    // Default behavior: update an existing task
    const taskIndex = this.tasks.findIndex(t => t.id === id && !t.is_deleted);
    
    if (taskIndex === -1) {
      this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
      return Promise.resolve(null);
    }
    
    const updatedTask = {
      ...this.tasks[taskIndex],
      ...taskData,
      updated_at: new Date().toISOString(),
      _is_synced: !this._isOffline,
      _sync_status: this._isOffline ? 'pending' : 'synced'
    } as Task;
    
    this.tasks[taskIndex] = updatedTask;
    
    // Emit task updated event
    this.emit('task-updated', updatedTask);
    this.emit('tasks-changed');
    
    // Track sync changes if offline
    if (this._isOffline) {
      this._hasUnsyncedChanges = true;
    }
    
    this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
    return updatedTask;
  }
  
  /**
   * Delete a task (soft delete)
   */
  async deleteTask(id: string): Promise<boolean> {
    this.methodCalls.deleteTask.push({ id });
    
    // Simulate network latency
    if (this._simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this._simulatedLatency));
    }
    
    // Emit loading event
    this.emit('loading' as unknown as keyof TaskServiceEvents, true as any);
    
    // Fail if next operation should fail
    if (this._failNextOperation) {
      this._failNextOperation = false;
      this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
      this.emit('error', new ServiceErrorImpl('mock_error', 'Simulated task delete error'));
      throw new Error('Simulated task delete error');
    }
    
    if (this.mockReturnValues.deleteTask instanceof Error) {
      return Promise.reject(this.mockReturnValues.deleteTask);
    }
    
    if (this.mockReturnValues.deleteTask !== undefined) {
      return Promise.resolve(this.mockReturnValues.deleteTask);
    }
    
    // Default behavior: soft delete
    const taskIndex = this.tasks.findIndex(t => t.id === id && !t.is_deleted);
    
    if (taskIndex === -1) {
      this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
      return Promise.resolve(false);
    }
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      is_deleted: true,
      updated_at: new Date().toISOString(),
      _is_synced: !this._isOffline,
      _sync_status: this._isOffline ? 'pending' : 'synced'
    } as Task;
    
    // Emit task deleted event
    this.emit('task-deleted', id);
    this.emit('tasks-changed');
    
    // Track sync changes if offline
    if (this._isOffline) {
      this._hasUnsyncedChanges = true;
    }
    
    this.emit('loading' as unknown as keyof TaskServiceEvents, false as any);
    return true;
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
   * Refresh tasks from the data source
   */
  async refreshTasks(): Promise<Task[]> {
    this.methodCalls.refreshTasks.push({});
    
    // Simulate network latency
    if (this._simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this._simulatedLatency));
    }
    
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
    this.emit('tasks-changed');
    
    return tasks;
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
   * Mark a task as complete
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
   * Get tasks by status
   */
  async getTasksByStatus(status: TaskStatusType): Promise<Task[]> {
    this.methodCalls.getTasksByStatus.push({ status });
    
    if (this.mockReturnValues.getTasksByStatus instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTasksByStatus);
    }
    
    if (this.mockReturnValues.getTasksByStatus !== undefined) {
      return Promise.resolve(this.mockReturnValues.getTasksByStatus);
    }
    
    // Default behavior: filter by status
    return this.tasks.filter(task => task.status === status && !task.is_deleted);
  }
  
  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: string): Promise<Task[]> {
    this.methodCalls.getTasksByProject.push({ projectId });
    
    if (this.mockReturnValues.getTasksByProject instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTasksByProject);
    }
    
    if (this.mockReturnValues.getTasksByProject !== undefined) {
      return Promise.resolve(this.mockReturnValues.getTasksByProject);
    }
    
    // Default behavior: filter by project (using list_id)
    return this.tasks.filter(task => task.list_id === projectId && !task.is_deleted);
  }
  
  /**
   * Get tasks by category
   */
  async getTasksByCategory(categoryName: string): Promise<Task[]> {
    this.methodCalls.getTasksByCategory.push({ categoryName });
    
    if (this.mockReturnValues.getTasksByCategory instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTasksByCategory);
    }
    
    if (this.mockReturnValues.getTasksByCategory !== undefined) {
      return Promise.resolve(this.mockReturnValues.getTasksByCategory);
    }
    
    // Default behavior: filter by category
    return this.tasks.filter(task => task.category_name === categoryName && !task.is_deleted);
  }
  
  /**
   * Get tasks due today
   */
  async getTasksForToday(): Promise<Task[]> {
    this.methodCalls.getTasksForToday.push({});
    
    if (this.mockReturnValues.getTasksForToday instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTasksForToday);
    }
    
    if (this.mockReturnValues.getTasksForToday !== undefined) {
      return Promise.resolve(this.mockReturnValues.getTasksForToday);
    }
    
    // Default behavior: filter by due date being today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.tasks.filter(task => {
      if (task.is_deleted || !task.due_date) return false;
      
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate < tomorrow;
    });
  }
  
  /**
   * Get tasks due this week
   */
  async getTasksForWeek(): Promise<Task[]> {
    this.methodCalls.getTasksForWeek.push({});
    
    if (this.mockReturnValues.getTasksForWeek instanceof Error) {
      return Promise.reject(this.mockReturnValues.getTasksForWeek);
    }
    
    if (this.mockReturnValues.getTasksForWeek !== undefined) {
      return Promise.resolve(this.mockReturnValues.getTasksForWeek);
    }
    
    // Default behavior: filter by due date being this week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    weekStart.setDate(diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return this.tasks.filter(task => {
      if (task.is_deleted || !task.due_date) return false;
      
      const dueDate = new Date(task.due_date);
      return dueDate >= weekStart && dueDate < weekEnd;
    });
  }
  
  /**
   * Filter tasks by criteria
   */
  async getFilteredTasks(criteria: any): Promise<Task[]> {
    this.methodCalls.getFilteredTasks.push({ criteria });
    
    if (this.mockReturnValues.getFilteredTasks instanceof Error) {
      return Promise.reject(this.mockReturnValues.getFilteredTasks);
    }
    
    if (this.mockReturnValues.getFilteredTasks !== undefined) {
      return Promise.resolve(this.mockReturnValues.getFilteredTasks);
    }
    
    // Default behavior: apply filter criteria
    return this.tasks.filter(task => {
      if (task.is_deleted) return false;
      
      // Match each criterion
      for (const [key, value] of Object.entries(criteria)) {
        if (key === 'status' && task.status !== value) return false;
        if (key === 'priority' && task.priority !== value) return false;
        if (key === 'category' && task.category_name !== value) return false;
        if (key === 'listId' && task.list_id !== value) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Sync tasks with the remote storage
   */
  async sync(): Promise<void> {
    this.methodCalls.sync.push({});
    
    if (this._failNextOperation) {
      this._failNextOperation = false;
      throw new Error('Simulated sync failure');
    }
    
    // Simulate network delay
    if (this._simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this._simulatedLatency));
    }
    
    this._hasUnsyncedChanges = false;
    this._isOffline = false;
  }
  
  /**
   * Force a refresh of tasks from remote storage
   */
  async forceRefresh(): Promise<void> {
    this.methodCalls.forceRefresh.push({});
    
    if (this._failNextOperation) {
      this._failNextOperation = false;
      throw new Error('Simulated refresh failure');
    }
    
    // Simulate network delay
    if (this._simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this._simulatedLatency));
    }
    
    // Emit tasks changed event
    this.emit('tasks-changed');
  }
  
  // Event handling methods
  
  /**
   * Subscribe to service events
   */
  on<K extends keyof TaskServiceEvents>(
    event: K, 
    callback: (data: TaskServiceEvents[K]) => void
  ): () => void {
    this.methodCalls.on.push({ event, callback });
    
    if (!this.eventCallbacks.has(event as string)) {
      this.eventCallbacks.set(event as string, new Set());
    }
    
    const callbacks = this.eventCallbacks.get(event as string)!;
    callbacks.add(callback as Function);
    
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
    
    if (!this.eventCallbacks.has(event as string)) {
      return;
    }
    
    const callbacks = this.eventCallbacks.get(event as string)!;
    callbacks.delete(callback as Function);
    
    if (callbacks.size === 0) {
      this.eventCallbacks.delete(event as string);
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
    
    if (!this.eventCallbacks.has(event as string)) {
      return;
    }
    
    const callbacks = this.eventCallbacks.get(event as string)!;
    
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
        
        // Emit error event if this isn't already the error event
        if (event !== 'error') {
          const serviceError = new ServiceErrorImpl(
            'event_handler_error',
            `Error in ${String(event)} event handler`,
            { originalError: error }
          );
          this.emit('error', serviceError);
        }
      }
    }
  }
  
  // Test helper methods
  
  /**
   * Simulate going offline
   */
  simulateOffline(offline: boolean = true): void {
    this._isOffline = offline;
  }
  
  /**
   * Simulate the next operation failing
   */
  simulateNextOperationFailing(): void {
    this._failNextOperation = true;
  }
  
  /**
   * Set simulated network latency in milliseconds
   */
  setSimulatedLatency(latencyMs: number): void {
    this._simulatedLatency = latencyMs;
  }
  
  /**
   * Reset the mock service state
   */
  reset(initialTasks: Task[] = []): void {
    this.tasks = [...initialTasks];
    this._isOffline = false;
    this._hasUnsyncedChanges = false;
    this._failNextOperation = false;
    this._simulatedLatency = 0;
    this.mockReturnValues = {};
    this.eventCallbacks.clear();
    
    // Reset method call tracking
    Object.keys(this.methodCalls).forEach(method => {
      this.methodCalls[method] = [];
    });
  }
}
