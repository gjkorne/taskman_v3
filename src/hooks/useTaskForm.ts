import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, TaskFormData } from '../components/TaskForm/schema';
import { getSubcategoryFromTags, updateSubcategoryInTags } from '../types/categories';
import { useTaskContext } from '../contexts/TaskContext';
import { taskService } from '../services/api';
import { TaskStatusValues, TaskPriority } from '../types/task';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

interface UseTaskFormProps {
  taskId?: string | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useTaskForm({ taskId, onSuccess, onError }: UseTaskFormProps = {}) {
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
      category: '',
      subcategory: '',
      dueDate: undefined,
      hasDueDate: false,
      tags: [],
      rawInput: '',
      estimatedTime: '',
      isDeleted: false
    }
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
    handleSubmit: rhfHandleSubmit
  } = form;

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
          // Extract subcategory from tags if present
          const subcategory = getSubcategoryFromTags(data.tags || []);
          
          // Set form values with proper type casting
          reset({
            title: data.title || '',
            description: data.description || '',
            // Use type assertion to handle the status string
            status: (data.status as TaskFormData['status']) || TaskStatusValues.PENDING,
            // Use type assertion to handle the priority string
            priority: (data.priority as TaskFormData['priority']) || TaskPriority.MEDIUM,
            category: data.category_name || '',
            subcategory: subcategory || '',
            dueDate: data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : undefined,
            hasDueDate: !!data.due_date,
            tags: Array.isArray(data.tags) ? data.tags : [],
            estimatedTime: data.estimated_time ? String(data.estimated_time).replace(/\D/g, '') : '',
            isDeleted: !!data.is_deleted,
            // Handle any additional data fields that might be present in the database but not in our type
            rawInput: (data as any).raw_input || ''
          });
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
  
  // Handle form submission
  const handleSubmit = async (formData: TaskFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update tags with subcategory if needed
      const updatedTags = updateSubcategoryInTags(
        formData.tags || [],
        formData.subcategory || ''
      );
      
      // Include tags in the form data
      const dataToSubmit = {
        ...formData,
        tags: updatedTags
      };
      
      // Call the appropriate API service method
      let result;
      if (taskId) {
        // Update existing task
        result = await taskService.updateTask(taskId, dataToSubmit);
      } else {
        // Create new task
        result = await taskService.createTask(dataToSubmit);
      }
      
      if (result.error) {
        throw result.error;
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
    handleSubmit: rhfHandleSubmit(handleSubmit)
  };
}
