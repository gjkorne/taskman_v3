import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TasksContext, { TasksProvider } from '../TasksContext';
import { ServiceFactory } from '../../../services/factory/ServiceFactory';
import { Task, TaskStatus } from '../../../types/task';
import { MockTaskService } from '../../../services/mocks/MockTaskService';
import { ErrorContext } from '../../error/ErrorContext';

// Mock tasks for testing
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Implement unit tests',
    description: 'Create tests for all components',
    status: TaskStatus.PENDING,
    priority: 'high',
    due_date: new Date(2025, 4, 20).toISOString(),
    tags: ['testing', 'important'],
    created_at: new Date(2025, 3, 10).toISOString(),
    updated_at: new Date(2025, 3, 10).toISOString(),
    created_by: 'user-1',
    estimated_time: null,
    actual_time: null,
    is_deleted: false,
    list_id: null,
    category_name: null,
    notes: null,
    checklist_items: null,
    note_type: null
  },
  {
    id: 'task-2',
    title: 'Review documentation',
    description: 'Ensure all documentation is up to date',
    status: TaskStatus.PENDING,
    priority: 'medium',
    due_date: new Date(2025, 3, 25).toISOString(),
    tags: ['documentation'],
    created_at: new Date(2025, 3, 15).toISOString(),
    updated_at: new Date(2025, 3, 15).toISOString(),
    created_by: 'user-1',
    estimated_time: null,
    actual_time: null,
    is_deleted: false,
    list_id: null,
    category_name: null,
    notes: null,
    checklist_items: null,
    note_type: null
  }
];

// Basic test component that uses TasksContext
const TestComponent: React.FC = () => {
  const { tasks, isLoading, error, refreshTasks } = React.useContext(TasksContext);
  const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;

  // Handlers for task operations
  const handleComplete = async (id: string) => {
    await taskService.updateTask(id, { status: TaskStatus.COMPLETED });
    refreshTasks();
  };

  const handleDelete = async (id: string) => {
    await taskService.deleteTask(id);
    refreshTasks();
  };

  const handleAddTask = async () => {
    await taskService.createTask({
      title: 'New Task',
      description: 'Task description',
      priority: 'medium',
      status: TaskStatus.PENDING,
      dueDate: new Date().toISOString(),
      hasDueDate: true,
      tags: [],
      created_by: 'user-1'
    });
    refreshTasks();
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Tasks</h1>
      <ul>
        {tasks.map(task => (
          <li key={task.id} data-testid={`task-${task.id}`}>
            <span className={task.status === TaskStatus.COMPLETED ? 'completed' : ''}>{task.title}</span>
            <button onClick={() => handleComplete(task.id)}>Complete</button>
            <button onClick={() => handleDelete(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={handleAddTask}>
        Add Task
      </button>
    </div>
  );
};

// Mock ErrorContext for tests
const MockErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const errorContext = {
    errors: [],
    addError: jest.fn(),
    clearErrors: jest.fn(),
    logError: jest.fn(),
    lastError: null,
    hasErrors: false,
    clearErrorsByType: jest.fn(),
    isNotificationVisible: false,
    dismissNotification: jest.fn()
  };
  
  return (
    <ErrorContext.Provider value={errorContext}>
      {children}
    </ErrorContext.Provider>
  );
};

describe('TasksContext', () => {
  beforeEach(() => {
    // Set up ServiceFactory for testing
    ServiceFactory.configure({ 
      mode: 'test',
      testData: { tasks: mockTasks }
    });

    // Clear any mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset the ServiceFactory
    ServiceFactory.reset();
  });

  test('provides tasks and loading state', async () => {
    render(
      <MockErrorProvider>
        <TasksProvider>
          <TestComponent />
        </TasksProvider>
      </MockErrorProvider>
    );

    // Initially should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Implement unit tests')).toBeInTheDocument();
      expect(screen.getByText('Review documentation')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    // Get the mock task service to spy on its methods
    const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;
    const createTaskSpy = jest.spyOn(taskService, 'createTask');

    render(
      <MockErrorProvider>
        <TasksProvider>
          <TestComponent />
        </TasksProvider>
      </MockErrorProvider>
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });

    // Click the add task button
    fireEvent.click(screen.getByText('Add Task'));

    // Verify createTask was called
    await waitFor(() => {
      expect(createTaskSpy).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Task',
        description: 'Task description'
      }));
    });

    // New task should be displayed
    await waitFor(() => {
      expect(screen.getByText('New Task')).toBeInTheDocument();
    });
  });

  test('completes a task', async () => {
    // Get the mock task service
    const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;
    const updateTaskSpy = jest.spyOn(taskService, 'updateTask');

    render(
      <MockErrorProvider>
        <TasksProvider>
          <TestComponent />
        </TasksProvider>
      </MockErrorProvider>
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Complete the first task
    const completeButtons = screen.getAllByText('Complete');
    fireEvent.click(completeButtons[0]);

    // Verify updateTask was called to mark as complete
    await waitFor(() => {
      expect(updateTaskSpy).toHaveBeenCalledWith('task-1', expect.objectContaining({
        status: TaskStatus.COMPLETED
      }));
    });
  });

  test('deletes a task', async () => {
    // Get the mock task service
    const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;
    const deleteTaskSpy = jest.spyOn(taskService, 'deleteTask');

    render(
      <MockErrorProvider>
        <TasksProvider>
          <TestComponent />
        </TasksProvider>
      </MockErrorProvider>
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Delete the second task
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[1]);

    // Verify deleteTask was called with the correct ID
    await waitFor(() => {
      expect(deleteTaskSpy).toHaveBeenCalledWith('task-2');
    });

    // Task should be removed from the UI
    await waitFor(() => {
      expect(screen.queryByText('Review documentation')).not.toBeInTheDocument();
    });
  });

  test('handles errors from the task service', async () => {
    // Configure mock task service to return an error
    const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;
    
    // Mock an error when getting tasks
    taskService.mockMethod('getTasks', { 
      error: { code: 'fetch_error', message: 'Failed to fetch tasks' } 
    });

    render(
      <MockErrorProvider>
        <TasksProvider>
          <TestComponent />
        </TasksProvider>
      </MockErrorProvider>
    );

    // Error should be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch tasks/i)).toBeInTheDocument();
    });
  });

  test('refreshes tasks', async () => {
    // Render with TasksContext
    const { rerender } = render(
      <MockErrorProvider>
        <TasksProvider>
          <TestComponent />
        </TasksProvider>
      </MockErrorProvider>
    );

    // Wait for initial tasks to load
    await waitFor(() => {
      expect(screen.getByText('Implement unit tests')).toBeInTheDocument();
    });

    // Get task service and modify data
    const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;
    
    // Update mock data with a new task that matches the Task interface
    const newTask: Task = {
      id: 'task-3',
      title: 'New requirement',
      description: 'Address new project requirements',
      status: TaskStatus.PENDING,
      priority: 'high',
      due_date: new Date(2025, 5, 1).toISOString(),
      tags: ['requirements'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user-1',
      estimated_time: null,
      actual_time: null,
      is_deleted: false,
      list_id: null,
      category_name: null,
      notes: null,
      checklist_items: null,
      note_type: null
    };
    
    // Update the mock service data
    taskService.setTasks([...mockTasks, newTask]);
    
    // Force a re-render to trigger a refresh
    rerender(
      <MockErrorProvider>
        <TasksProvider>
          <TestComponent />
        </TasksProvider>
      </MockErrorProvider>
    );

    // New task should appear
    await waitFor(() => {
      expect(screen.getByText('New requirement')).toBeInTheDocument();
    });
  });
});
