import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, TaskFormData } from '../components/TaskForm/schema';
import {
  getSubcategoryFromTags,
  updateSubcategoryInTags,
} from '../types/categories';
import { useTaskContext } from '../contexts/TaskCompat';
import { taskService } from '../services/api';
import { TaskStatusValues, TaskPriority, Task } from '../types/task';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Debug flag for task form operations
const DEBUG_TASK_FORM = isDevelopment && false; // Set to true to enable debugging

interface UseTaskFormProps {
  taskId?: string | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for managing task form state and submissions
 * Handles both creation and editing of tasks with proper database field mapping
 */
export function useTaskForm({
  taskId,
  onSuccess,
  onError,
}: UseTaskFormProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshTasks } = useTaskContext();

  // Initialize form with react-hook-form + zod validation
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: TaskStatusValues.PENDING,
      priority: TaskPriority.MEDIUM,
      category_name: '', // DB field name
      subcategory: '',
      due_date: undefined, // DB field name
      hasDueDate: false,
      tags: [],
      rawInput: '',
      estimatedTime: '',
      is_deleted: false,
      list_id: undefined,
    },
  });

  // Destructure form methods for easier access
  const {
    control,
    register,
    formState,
    watch,
    setValue,
    getValues,
    reset,
    handleSubmit: rhfHandleSubmit,
  } = form;

  /**
   * Map database fields to form fields
   * Handles special conversions like intervals and dates
   */
  const mapDatabaseToFormData = (task: Task): TaskFormData => {
    if (DEBUG_TASK_FORM) {
      console.log('Mapping DB task to form data:', task);
    }

    // Extract subcategory from tags if present
    const subcategory = getSubcategoryFromTags(task.tags || []);

    // Parse estimated time from interval string if present
    let estimatedTime = '';
    if (task.estimated_time) {
      // Extract numeric value from PostgreSQL interval (e.g., "30 minutes")
      const matches = task.estimated_time.match(/(\d+)/);
      if (matches && matches[1]) {
        estimatedTime = matches[1];
      }
    }

    return {
      title: task.title || '',
      description: task.description || '',
      status: (task.status as any) || TaskStatusValues.PENDING,
      priority: (task.priority as any) || TaskPriority.MEDIUM,
      category_name: task.category_name || '',
      subcategory: subcategory || '',
      due_date: task.due_date,
      hasDueDate: !!task.due_date,
      tags: Array.isArray(task.tags) ? task.tags : [],
      estimatedTime: estimatedTime,
      is_deleted: !!task.is_deleted,
      rawInput: (task as any).raw_input || '',
      list_id: task.list_id,
    };
  };

  // Fetch task data if editing an existing task
  useEffect(() => {
    async function fetchTaskData() {
      if (!taskId) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: apiError } = await taskService.getTaskById(taskId);

        if (apiError) throw apiError;

        if (data) {
          // Map the database task to form data format
          const formData = mapDatabaseToFormData(data);

          if (DEBUG_TASK_FORM) {
            console.log('Setting form with data:', formData);
          }

          // Reset form with mapped data
          reset(formData);
        }
      } catch (err) {
        if (isDevelopment) {
          console.error('Error fetching task:', err);
        }
        setError('Failed to load task data');
        onError?.('Failed to load task data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTaskData();
  }, [taskId, reset]);

  /**
   * Create API-friendly object from form data
   */
  const prepareApiData = (formData: TaskFormData) => {
    // Update tags with subcategory if needed
    const updatedTags = updateSubcategoryInTags(
      formData.tags || [],
      formData.subcategory || ''
    );

    // Prepare the data for API consumption
    return {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      category: formData.category_name || '', // Map category_name to category for API
      subcategory: formData.subcategory,
      dueDate: formData.due_date, // Map to UI field name
      hasDueDate: formData.hasDueDate,
      tags: updatedTags,
      estimatedTime: formData.estimatedTime,
      isDeleted: formData.is_deleted, // Map to UI field name
      rawInput: formData.rawInput,
      listId: formData.list_id, // Map to UI field name
    };
  };

  // Handle form submission
  const handleSubmit = async (formData: TaskFormData) => {
    if (DEBUG_TASK_FORM) {
      console.log('Submitting form data:', formData);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API consumption
      const apiData = prepareApiData(formData);

      if (DEBUG_TASK_FORM) {
        console.log('Prepared data for API:', apiData);
      }

      // Call the appropriate API service method
      let result;
      if (taskId) {
        // Update existing task - type assertion to satisfy TypeScript
        result = await taskService.updateTask(taskId, apiData as any);
      } else {
        // Create new task - type assertion to satisfy TypeScript
        result = await taskService.createTask(apiData as any);
      }

      if (result.error) {
        throw result.error;
      }

      if (DEBUG_TASK_FORM && result.data) {
        console.log('Task saved successfully:', result.data);
      }

      // Refresh tasks to get the latest data
      await refreshTasks();

      // Call success callback
      onSuccess?.();

      // Reset form if creating a new task
      if (!taskId) {
        reset();
      }
    } catch (err: any) {
      if (isDevelopment) {
        console.error('Error saving task:', err);
      }

      const errorMessage = err.message || 'Failed to save task';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Return the complete form object for advanced usage if needed
    form,

    // Return individual form methods for convenience
    control,
    register,
    formState,
    errors: formState.errors,
    watch,
    setValue,
    getValues,
    reset,

    // Return custom hook state
    isLoading,
    error,

    // Return the submit handler
    handleSubmit: rhfHandleSubmit(handleSubmit),
  };
}
