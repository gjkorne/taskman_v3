import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, TaskFormData } from '../components/TaskForm/schema';
import { supabase } from '../lib/supabase';
import { getSubcategoryFromTags, updateSubcategoryInTags } from '../types/categories';
import { useTaskContext } from '../contexts/TaskContext';

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
      status: 'pending',
      priority: 'medium',
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
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Extract subcategory from tags if present
          const subcategory = getSubcategoryFromTags(data.tags || []);
          
          // Set form values
          reset({
            title: data.title || '',
            description: data.description || '',
            status: data.status || 'pending',
            priority: data.priority || 'medium',
            category: data.category_name || '',
            subcategory: subcategory || '',
            dueDate: data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : undefined,
            hasDueDate: !!data.due_date,
            tags: Array.isArray(data.tags) ? data.tags : [],
            estimatedTime: data.estimated_time ? String(data.estimated_time).replace(/\D/g, '') : '',
            isDeleted: !!data.is_deleted,
            rawInput: data.raw_input || ''
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
      // Check for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to perform this action');
      }
      
      // Update tags with subcategory if needed
      const updatedTags = updateSubcategoryInTags(
        formData.tags || [],
        formData.subcategory || ''
      );
      
      // Format data for database
      const dataToSubmit: Record<string, any> = {
        title: formData.title,
        description: formData.description || '',
        status: formData.status || 'pending',
        priority: formData.priority || 'medium',
        category_name: formData.category || null,
        due_date: formData.hasDueDate ? formData.dueDate : null,
        tags: updatedTags,
        is_deleted: formData.isDeleted || false
      };
      
      // Convert estimated time to interval format if provided
      if (formData.estimatedTime) {
        // Parse to ensure it's a number and format as PostgreSQL interval
        const minutes = parseInt(formData.estimatedTime, 10);
        if (!isNaN(minutes)) {
          dataToSubmit.estimated_time = `${minutes} minutes`;
        }
      }
      
      // Add rawInput if present (for NLP processing)
      if (formData.rawInput) {
        dataToSubmit.raw_input = formData.rawInput;
      }
      
      let result;
      
      if (taskId) {
        // Update existing task
        result = await supabase
          .from('tasks')
          .update(dataToSubmit)
          .eq('id', taskId);
      } else {
        // Create new task
        dataToSubmit.created_by = session.user.id;
        
        result = await supabase
          .from('tasks')
          .insert(dataToSubmit);
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
