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
      tags: []
    }
  });

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
          form.reset({
            title: data.title || '',
            description: data.description || '',
            status: data.status || 'pending',
            priority: data.priority || 'medium',
            category: data.category_name || '',
            subcategory: subcategory || '',
            dueDate: data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : undefined,
            hasDueDate: !!data.due_date,
            tags: Array.isArray(data.tags) ? data.tags : []
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
  }, [taskId, form]);
  
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
        tags: updatedTags
      };
      
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
        form.reset();
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
    form,
    isLoading,
    error,
    handleSubmit: form.handleSubmit(handleSubmit),
    formState: form.formState,
    register: form.register,
    setValue: form.setValue,
    watch: form.watch,
    getValues: form.getValues,
    reset: form.reset
  };
}
