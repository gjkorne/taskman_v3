import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskList } from '../TaskList';
import { ServiceFactory } from '../../../services/factory/ServiceFactory';
import { Task, TaskStatus } from '../../../types/task';
import TasksContext from '../../../contexts/tasks/TasksContext';
import React from 'react';

// Mock tasks for testing
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the TaskMan app',
    status: TaskStatus.PENDING,
    priority: 'high',
    due_date: new Date(2025, 4, 15).toISOString(),
    tags: ['documentation', 'important'],
    created_at: new Date(2025, 3, 1).toISOString(),
    updated_at: new Date(2025, 3, 1).toISOString(),
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
    title: 'Fix filtering bug',
    description: 'Address issue with task filtering by priority',
    status: TaskStatus.COMPLETED,
    priority: 'medium',
    due_date: new Date(2025, 3, 30).toISOString(),
    tags: ['bug', 'filtering'],
    created_at: new Date(2025, 3, 15).toISOString(),
    updated_at: new Date(2025, 3, 28).toISOString(),
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

// Mock TasksContext
const MockTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for tasks
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks);
  const [isLoading] = React.useState(false);
  const [error] = React.useState<Error | null>(null);

  // Mock context functions
  const addTask = jest.fn(async (task) => {
    const newTask = {
      id: `task-${Date.now()}`,
      ...task,
      created_at: new Date().toISOString(),
      updated_at: null
    } as Task;
    
    setTasks([...tasks, newTask]);
    return { success: true, task: newTask };
  });
  
  const deleteTask = jest.fn(async (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    return { success: true };
  });
  
  const updateTask = jest.fn(async (id, updates) => {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return { success: false };
    }
    
    const updatedTask = { ...tasks[taskIndex], ...updates, updated_at: new Date().toISOString() };
    const newTasks = [...tasks];
    newTasks[taskIndex] = updatedTask;
    setTasks(newTasks);
    
    return { success: true, task: updatedTask };
  });
  
  const completeTask = jest.fn(async (id) => {
    return updateTask(id, { status: 'completed' });
  });

  const contextValue = {
    tasks,
    isLoading,
    error,
    addTask,
    deleteTask,
    updateTask,
    completeTask,
    refreshTasks: jest.fn(),
    getTaskById: jest.fn((id) => tasks.find(task => task.id === id)),
    filterTasksByStatus: jest.fn((status) => tasks.filter(task => task.status === status)),
    filterTasksByPriority: jest.fn((priority) => tasks.filter(task => task.priority === priority))
  };

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
};

describe('TaskList Component', () => {
  beforeEach(() => {
    // Set up ServiceFactory for testing
    ServiceFactory.configure({ 
      mode: 'test',
      testData: { 
        tasks: mockTasks 
      }
    });

    // Clear mocks
    jest.clearAllMocks();
  });

  test('renders the list of tasks', async () => {
    // Render the component with our mock context
    render(
      <MockTasksProvider>
        <TaskList />
      </MockTasksProvider>
    );

    // Check if tasks are displayed
    expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    expect(screen.getByText('Fix filtering bug')).toBeInTheDocument();
  });

  test('marks a task as complete when clicked', async () => {
    // Get mock task service from factory
    const taskService = ServiceFactory.getService('TaskService') as any;
    
    // Spy on the updateTask method
    const updateTaskSpy = jest.spyOn(taskService, 'updateTask');
    
    // Render the component
    render(
      <MockTasksProvider>
        <TaskList />
      </MockTasksProvider>
    );

    // Find and click the complete button for the first task
    const completeButton = screen.getAllByRole('button', { name: /complete/i })[0];
    fireEvent.click(completeButton);

    // Check if the complete function was called and task was updated
    await waitFor(() => {
      expect(updateTaskSpy).toHaveBeenCalledWith('task-1', { status: 'completed' });
    });
  });

  test('deletes a task when delete button is clicked', async () => {
    // Get mock task service
    const taskService = ServiceFactory.getService('TaskService') as any;
    
    // Spy on the deleteTask method
    const deleteTaskSpy = jest.spyOn(taskService, 'deleteTask');
    
    // Render component
    render(
      <MockTasksProvider>
        <TaskList />
      </MockTasksProvider>
    );

    // Find and click the delete button for the second task
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[1]);

    // Check that delete was called with correct task ID
    await waitFor(() => {
      expect(deleteTaskSpy).toHaveBeenCalledWith('task-2');
    });
  });

  test('shows error state when task service fails', async () => {
    // Get mock task service
    const taskService = ServiceFactory.getService('TaskService') as any;
    
    // Mock error for getTasks
    taskService.mockMethod('getTasks', { 
      error: { code: 'error', message: 'Failed to load tasks' } 
    });
    
    // Render component
    render(
      <MockTasksProvider>
        <TaskList />
      </MockTasksProvider>
    );

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load tasks/i)).toBeInTheDocument();
    });
  });

  test('filters tasks based on filter criteria', async () => {
    // Get mock filter service
    const filterSortService = ServiceFactory.getService('FilterSortService') as any;
    
    // Setup a filter that only shows high priority tasks
    filterSortService.mockMethod('filterTasks', [mockTasks[0]]);
    
    // Render with filter applied
    render(
      <MockTasksProvider>
        <TaskList filter={{ priority: 'high' }} />
      </MockTasksProvider>
    );

    // Should show only the high priority task
    expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    expect(screen.queryByText('Fix filtering bug')).not.toBeInTheDocument();
  });
});
