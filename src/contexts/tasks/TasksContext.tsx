import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Task } from '../../types/task';

type TasksContextType = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
};

const defaultContext: TasksContextType = {
  tasks: [],
  isLoading: false,
  error: null,
  refreshTasks: async () => {},
};

const TasksContext = createContext<TasksContextType>(defaultContext);

export const useTasks = () => useContext(TasksContext);

type TasksProviderProps = {
  children: ReactNode;
};

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would call the task service
      // const taskService = ServiceRegistry.getTaskService();
      // const result = await taskService.getTasks();
      // setTasks(result);
      
      // For test purposes, we'll just set a dummy task
      setTasks([
        {
          id: '1',
          title: 'Test Task',
          description: 'This is a test task',
          status: 'in_progress',
          priority: 'medium',
          category_name: 'Work',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          due_date: null,
          created_by: 'test-user', // Added correct field from Task interface
          tags: [],
          is_deleted: false,
          estimated_time: null,
          actual_time: null,
          list_id: null,
          notes: null,
          checklist_items: null,
          note_type: null
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  return (
    <TasksContext.Provider value={{ tasks, isLoading, error, refreshTasks }}>
      {children}
    </TasksContext.Provider>
  );
};

export default TasksContext;
