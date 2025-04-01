import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, type TaskFormData } from './schema';
import { RichTextEditor } from './RichTextEditor';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { TaskDebug } from './TaskDebug';
import { CATEGORIES, updateSubcategoryInTags } from '../../types/categories';

export function TaskForm({ onTaskCreated }: { onTaskCreated?: () => void }) {
  // Setup React Hook Form
  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors },
    watch
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      rawInput: '',
      priority: 'medium',
      category: '',
      status: 'pending',
      hasDueDate: false,
      dueDate: '',
      tags: [],
      isDeleted: false,
      estimatedTime: ''
    }
  });

  // Watch the category field to show subcategories
  const selectedCategory = watch('category') as keyof typeof CATEGORIES | '';

  // This state is used to store the form error
  const [formError, setFormError] = React.useState<string | null>(null);

  // This state is used to track whether the description is expanded or not
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  // This mutation is used to create a new task in the database
  const createTask = useMutation({
    // This is the function that will be called when the mutation is triggered
    mutationFn: async (data: TaskFormData) => {
      // Get the current user session to ensure auth context is available
      const { data: sessionData } = await supabase.auth.getSession();
      const { session } = sessionData;

      if (!session) {
        console.error('No active session found. User is not authenticated.');
        throw new Error('You must be logged in to create tasks');
      }

      // Compile the task data
      const taskData: Record<string, any> = {
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium',
        status: 'pending',
        category_name: data.category,
        tags: [], // Initialize tags as empty array
        is_deleted: false, // Explicitly set is_deleted to false
        created_by: session.user.id
      };

      console.log('Session authenticated user ID:', session.user.id);
      console.log('Creating task with data:', JSON.stringify(taskData, null, 2));
      
      // Simple insertion with proper authentication
      const { error } = await supabase
        .from('tasks')
        .insert([taskData]);

      if (error) {
        console.error('Task creation error:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        throw error;
      }
      
      console.log('Task created successfully');
    },
  });

  // Submit function to create a task
  const onSubmit = async (data: TaskFormData) => {
    try {
      setFormError(null);
      
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFormError('You must be logged in to create tasks');
        return;
      }

      // Get the selected subcategory if any
      const subcategoryElement = document.querySelector('input[name="subcategory"]:checked') as HTMLInputElement;
      const selectedSubcategory = subcategoryElement?.value;
  
      // Add subcategory as a tag if selected
      const tagsWithSubcategory = updateSubcategoryInTags(data.tags || [], selectedSubcategory);

      // Compile the task data
      const taskData: Record<string, any> = {
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium',
        status: data.status || 'pending',
        category_name: data.category,
        tags: tagsWithSubcategory,
        is_deleted: data.isDeleted || false,
        created_by: session.user.id
      };
      
      // Convert estimated time to interval format if provided
      if (data.estimatedTime) {
        // Convert minutes to PostgreSQL interval format: 'X minutes'
        taskData.estimated_time = `${data.estimatedTime} minutes`;
      }
      
      // Add due date if selected
      if (data.hasDueDate && data.dueDate) {
        taskData.due_date = new Date(data.dueDate).toISOString();
      }
      
      console.log('Creating task with data:', taskData);
      
      // Insert into database
      const { error, data: newTask } = await supabase
        .from('tasks')
        .insert([taskData])
        .select('title');
      
      if (error) throw error;
      
      console.log('Successfully created task:', newTask);
      
      // Call the callback if it exists
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      console.error('Task creation error:', error);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        setFormError(`Failed to create task: ${error.message}`);
      } else {
        setFormError('An unknown error occurred');
      }
    }
  };

  return (
    <div className="w-full">
      {process.env.NODE_ENV !== 'production' && <TaskDebug />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {formError && (
          // Display the form error if there is one
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{formError}</p>
            </div>
          </div>
        )}

        {/* TASK INFORMATION */}
        <div className="space-y-6 form-card p-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Task Detail</h2>
          
          <div>
            <label htmlFor="task-title" className="block text-sm font-semibold text-gray-800">Task Title</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              autoFocus
              id="task-title"
              {...register('title')}
              className={cn(
                'mt-1 block w-full rounded-lg glass-input shadow-lg transition-all text-lg',
                errors.title && 'border-red-500'
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="task-notes" className="block text-sm font-semibold text-gray-800">
                Notes
              </label>
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="flex items-center text-xs text-gray-500 hover:text-gray-700"
              >
                {isDescriptionExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Expand
                  </>
                )}
              </button>
            </div>
            <div className={cn(!isDescriptionExpanded && 'hidden')}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor id="task-notes" value={field.value || ''} onChange={field.onChange} />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* CLASSIFICATION */}
        <div className="space-y-6 form-card p-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Classification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category')}
                className={cn(
                  "w-full px-3 py-2 border rounded-md",
                  errors.category ? "border-red-500" : "border-gray-300"
                )}
              >
                <option value="">-- Select Category --</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="childcare">Childcare</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time (minutes)
              </label>
              <input
                type="number"
                min="0"
                {...register('estimatedTime')}
                placeholder="e.g., 60"
                className={cn(
                  "w-full px-3 py-2 border rounded-md",
                  errors.estimatedTime ? "border-red-500" : "border-gray-300"
                )}
              />
              {errors.estimatedTime && (
                <p className="mt-1 text-sm text-red-500">{errors.estimatedTime.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Enter total minutes (e.g., 300 for 5 hours)</p>
            </div>
          </div>
          
          {/* Subcategory selection - only shown when a category is selected */}
          {selectedCategory && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES[selectedCategory].map((subcategory) => (
                  <label key={subcategory} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                    <input
                      type="radio"
                      value={subcategory}
                      id={`subcategory-${subcategory.replace(/\s+/g, '-').toLowerCase()}`}
                      name="subcategory"
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{subcategory}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">Subcategory will be saved as a tag</p>
            </div>
          )}
        </div>

        {/* PRIORITY & TIMING */}
        <div className="space-y-6 form-card p-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Priority & Timing</h2>
          
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">Priority Level</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="urgent"
                  id="priority-urgent"
                  {...register('priority')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="flex items-center space-x-2 text-sm text-gray-900">
                  <Flag className="w-4 h-4 text-red-500" />
                  <span>P1 (Urgent)</span>
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="high"
                  id="priority-high"
                  {...register('priority')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="flex items-center space-x-2 text-sm text-gray-900">
                  <Flag className="w-4 h-4 text-yellow-500" />
                  <span>P2 (High)</span>
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="medium"
                  id="priority-medium"
                  {...register('priority')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="flex items-center space-x-2 text-sm text-gray-900">
                  <Flag className="w-4 h-4 text-blue-500" />
                  <span>P3 (Medium)</span>
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="low"
                  id="priority-low"
                  {...register('priority')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="flex items-center space-x-2 text-sm text-gray-900">
                  <Flag className="w-4 h-4 text-green-500" />
                  <span>P4 (Low)</span>
                </span>
              </label>
            </div>
            {errors.priority && (
              <p className="text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800">Due Date</label>
              <input
                type="date"
                {...register('dueDate')}
                className={cn(
                  'mt-1 block w-full rounded-lg glass-input shadow-sm',
                  errors.dueDate && 'border-red-500'
                )}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="px-6 py-3 border border-transparent rounded-lg shadow-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            disabled={createTask.isPending}
          >
            {createTask.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}