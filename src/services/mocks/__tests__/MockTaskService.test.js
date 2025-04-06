// Tests for the MockTaskService
// This demonstrates how to use the mock in your component and service tests

import { MockTaskService } from '../MockTaskService';
import { TaskStatus, TaskPriority } from '../../../types/task';

describe('MockTaskService', () => {
  let mockService;

  beforeEach(() => {
    // Create a fresh instance of the mock service for each test
    mockService = new MockTaskService();
  });

  test('creates tasks correctly', async () => {
    // Create a test task
    const newTask = await mockService.createTask({
      title: 'Test Task',
      description: 'This is a test task',
      priority: TaskPriority.HIGH,
      status: TaskStatus.ACTIVE
    });
    
    // Verify task was created with the right properties
    expect(newTask).toBeTruthy();
    expect(newTask.id).toBeDefined();
    expect(newTask.title).toBe('Test Task');
    expect(newTask.priority).toBe(TaskPriority.HIGH);
    
    // Verify method call was tracked
    expect(mockService.methodCalls.createTask.length).toBe(1);
  });

  test('gets all tasks', async () => {
    // Create a few test tasks
    await mockService.createTask({ title: 'Task 1' });
    await mockService.createTask({ title: 'Task 2' });
    await mockService.createTask({ title: 'Task 3' });
    
    // Get all tasks
    const tasks = await mockService.getTasks();
    
    // Verify we get all tasks back
    expect(tasks.length).toBe(3);
    expect(tasks[0].title).toBe('Task 1');
    expect(tasks[1].title).toBe('Task 2');
    expect(tasks[2].title).toBe('Task 3');
  });

  test('gets task by ID', async () => {
    // Create a test task
    const task = await mockService.createTask({ title: 'Find Me' });
    
    // Get the task by ID
    const foundTask = await mockService.getTaskById(task.id);
    
    // Verify we found the right task
    expect(foundTask).toBeTruthy();
    expect(foundTask.id).toBe(task.id);
    expect(foundTask.title).toBe('Find Me');
    
    // Try to get a non-existent task
    const notFound = await mockService.getTaskById('not-a-real-id');
    expect(notFound).toBeNull();
  });

  test('updates tasks correctly', async () => {
    // Create a test task
    const task = await mockService.createTask({ 
      title: 'Original Title',
      description: 'Original description',
      priority: TaskPriority.LOW
    });
    
    // Update the task
    const updatedTask = await mockService.updateTask(task.id, {
      title: 'Updated Title',
      priority: TaskPriority.HIGH
    });
    
    // Verify the task was updated correctly
    expect(updatedTask.title).toBe('Updated Title');
    expect(updatedTask.priority).toBe(TaskPriority.HIGH);
    expect(updatedTask.description).toBe('Original description'); // Unchanged
    
    // Verify updated_at was changed
    expect(updatedTask.updated_at).not.toBe(task.updated_at);
    
    // Verify method call was tracked
    expect(mockService.methodCalls.updateTask.length).toBe(1);
  });

  test('deletes tasks correctly', async () => {
    // Create a test task
    const task = await mockService.createTask({ title: 'Delete Me' });
    
    // Delete the task
    const result = await mockService.deleteTask(task.id);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify task is no longer returned by getTasks
    const tasks = await mockService.getTasks();
    expect(tasks.length).toBe(0);
    
    // Try to delete a non-existent task
    const failedResult = await mockService.deleteTask('not-a-real-id');
    expect(failedResult).toBe(false);
  });

  test('updates task status', async () => {
    // Create a test task with PENDING status
    const task = await mockService.createTask({ 
      title: 'Status Update Test',
      status: TaskStatus.PENDING
    });
    
    // Update the task status to ACTIVE
    const updatedTask = await mockService.updateTaskStatus(task.id, TaskStatus.ACTIVE);
    
    // Verify status was updated
    expect(updatedTask.status).toBe(TaskStatus.ACTIVE);
    
    // Verify method calls were tracked
    expect(mockService.methodCalls.updateTaskStatus.length).toBe(1);
  });

  test('handles start task', async () => {
    // Create a test task
    const task = await mockService.createTask({ 
      title: 'Start Me',
      status: TaskStatus.PENDING
    });
    
    // Start the task
    const startedTask = await mockService.startTask(task.id);
    
    // Verify status was set to ACTIVE
    expect(startedTask.status).toBe(TaskStatus.ACTIVE);
    
    // Verify method calls were tracked
    expect(mockService.methodCalls.startTask.length).toBe(1);
    expect(mockService.methodCalls.updateTaskStatus.length).toBe(1);
  });

  test('handles complete task', async () => {
    // Create a test task
    const task = await mockService.createTask({ 
      title: 'Complete Me',
      status: TaskStatus.ACTIVE
    });
    
    // Complete the task
    const completedTask = await mockService.completeTask(task.id);
    
    // Verify status was set to COMPLETED
    expect(completedTask.status).toBe(TaskStatus.COMPLETED);
    
    // Verify method calls were tracked
    expect(mockService.methodCalls.completeTask.length).toBe(1);
    expect(mockService.methodCalls.updateTaskStatus.length).toBe(1);
  });

  test('simulates offline mode', async () => {
    // Simulate going offline
    mockService.simulateOffline(true);
    
    // Create a task while offline
    const task = await mockService.createTask({ title: 'Offline Task' });
    
    // Verify task has the right sync status
    expect(task._is_synced).toBe(false);
    expect(task._sync_status).toBe('pending');
    
    // Verify unsyncedChanges is true
    expect(await mockService.hasUnsyncedChanges()).toBe(true);
    
    // Simulate going back online and syncing
    mockService.simulateOffline(false);
    await mockService.syncChanges();
    
    // Verify all is now synced
    expect(await mockService.hasUnsyncedChanges()).toBe(false);
    
    // Get the task and check its sync status
    const syncedTask = await mockService.getTaskById(task.id);
    expect(syncedTask._is_synced).toBe(true);
    expect(syncedTask._sync_status).toBe('synced');
  });

  test('emits events', async () => {
    // Create event listeners
    const createdHandler = jest.fn();
    const updatedHandler = jest.fn();
    const deletedHandler = jest.fn();
    const changedHandler = jest.fn();
    
    // Register the listeners
    mockService.on('task-created', createdHandler);
    mockService.on('task-updated', updatedHandler);
    mockService.on('task-deleted', deletedHandler);
    mockService.on('tasks-changed', changedHandler);
    
    // Create a task
    const task = await mockService.createTask({ title: 'Event Test' });
    
    // Verify created event was emitted
    expect(createdHandler).toHaveBeenCalledWith(task);
    expect(changedHandler).toHaveBeenCalled();
    
    // Update the task
    const updatedTask = await mockService.updateTask(task.id, { title: 'Updated Event Test' });
    
    // Verify updated event was emitted
    expect(updatedHandler).toHaveBeenCalledWith(updatedTask);
    expect(changedHandler).toHaveBeenCalledTimes(2);
    
    // Delete the task
    await mockService.deleteTask(task.id);
    
    // Verify deleted event was emitted
    expect(deletedHandler).toHaveBeenCalledWith(task.id);
    expect(changedHandler).toHaveBeenCalledTimes(3);
  });

  test('allows mocking method return values', async () => {
    // Create a mock task
    const mockTask = {
      id: 'mock-id',
      title: 'Mock Task',
      status: TaskStatus.ACTIVE,
      priority: TaskPriority.HIGH,
      created_at: new Date().toISOString(),
      is_deleted: false
    };
    
    // Mock the getTaskById method
    mockService.mockMethod('getTaskById', mockTask);
    
    // Call the method with any ID
    const result = await mockService.getTaskById('any-id');
    
    // Verify the mock value is returned
    expect(result).toBe(mockTask);
    expect(result.id).toBe('mock-id');
    
    // Verify method call was tracked
    expect(mockService.methodCalls.getTaskById.length).toBe(1);
    expect(mockService.methodCalls.getTaskById[0].id).toBe('any-id');
  });

  test('handles errors', async () => {
    // Create a mock error
    const mockError = new Error('Task not found');
    
    // Mock the getTaskById method to throw an error
    mockService.mockMethod('getTaskById', mockError);
    
    // Set up an error handler
    const errorHandler = jest.fn();
    mockService.on('error', errorHandler);
    
    // Call the method and expect it to throw
    await expect(mockService.getTaskById('any-id')).rejects.toThrow('Task not found');
    
    // Simulate an error explicitly
    mockService.simulateError('custom_error', 'Custom error message');
    
    // Verify error was emitted
    expect(errorHandler).toHaveBeenCalled();
    expect(errorHandler.mock.calls[0][0].message).toBe('Custom error message');
  });

  test('resets state', async () => {
    // Create some tasks
    await mockService.createTask({ title: 'Task 1' });
    await mockService.createTask({ title: 'Task 2' });
    
    // Verify tasks were created
    expect((await mockService.getTasks()).length).toBe(2);
    
    // Reset the mock service
    mockService.reset();
    
    // Verify tasks are gone
    expect((await mockService.getTasks()).length).toBe(0);
    
    // Verify method call tracking is reset
    expect(mockService.methodCalls.createTask.length).toBe(0);
  });

  test('can set tasks directly', async () => {
    // Create some predefined tasks
    const predefinedTasks = [
      {
        id: 'preset-1',
        title: 'Preset Task 1',
        description: 'First preset task',
        status: TaskStatus.ACTIVE,
        priority: TaskPriority.HIGH,
        created_at: new Date().toISOString(),
        updated_at: null,
        is_deleted: false
      },
      {
        id: 'preset-2',
        title: 'Preset Task 2',
        description: 'Second preset task',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
        created_at: new Date().toISOString(),
        updated_at: null,
        is_deleted: false
      }
    ];
    
    // Set the tasks directly
    mockService.setTasks(predefinedTasks);
    
    // Verify tasks are accessible
    const tasks = await mockService.getTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].id).toBe('preset-1');
    expect(tasks[1].id).toBe('preset-2');
    
    // Verify we can find by ID
    const task = await mockService.getTaskById('preset-2');
    expect(task).toBeTruthy();
    expect(task.title).toBe('Preset Task 2');
  });

  test('gets tasks by status', async () => {
    // Create tasks with different statuses
    await mockService.createTask({ title: 'Task 1', status: TaskStatus.ACTIVE });
    await mockService.createTask({ title: 'Task 2', status: TaskStatus.PENDING });
    await mockService.createTask({ title: 'Task 3', status: TaskStatus.ACTIVE });
    await mockService.createTask({ title: 'Task 4', status: TaskStatus.COMPLETED });
    
    // Get active tasks
    const activeTasks = mockService.getTasksByStatus(TaskStatus.ACTIVE);
    
    // Verify we got the right tasks
    expect(activeTasks.length).toBe(2);
    expect(activeTasks[0].title).toBe('Task 1');
    expect(activeTasks[1].title).toBe('Task 3');
  });
});
