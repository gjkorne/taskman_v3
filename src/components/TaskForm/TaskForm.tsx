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

const CATEGORIES = {
  childcare: [
    'Core Care',
    'Play & Engagement',
    'Learning & Schoolwork',
    'Routines',
    'Outings & Activities',
    'Admin'
  ],
  work: [
    'Core Execution',
    'Planning & Strategy',
    'Communication & Meetings',
    'Learning & Research',
    'Maintenance/Admin',
    'Projects & Deliverables'
  ],
  personal: [
    'Health & Wellness',
    'Relationships & Social',
    'Home & Chores',
    'Finance & Admin',
    'Growth & Learning',
    'Fun & Recreation'
  ],
  other: [
    'Core',
    'Unexpected/Interruptions',
    'Unsorted',
    'Overflow',
    'External Requests',
    'Reflections & Journaling'
  ]
} as const;

export function TaskForm({ onTaskCreated }: { onTaskCreated?: () => void }) {
  // Comment out NLP-related state and functions since they will be developed later
  // const [taskInput, setTaskInput] = React.useState('');

  // Setup React Hook Form
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      context: [],
      isEvergreen: false,
      isBlocked: false,
      isWaiting: false,
      hasDueDate: false,
      rawInput: '',
      energyLevel: 'medium',
      description: '',
    },
  });

  // This state is used to store the form error
  const [formError, setFormError] = React.useState<string | null>(null);

  // This state is used to track whether the description is expanded or not
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  // This is the selected category
  const selectedCategory = watch('category');

  // Comment out NLP-related code that will be developed later
  /*
  // This mutation is used to process the user's raw task input
  const processTaskInput = useMutation({
    // This is the function that will be called when the mutation is triggered
    mutationFn: async (input: string) => {
      // Get the current user from the Supabase client
      const { data: { user } } = await supabase.auth.getUser();
      
      // If the user is not logged in, throw an error
      if (!user) {
        throw new Error('You must be logged in to process tasks');
      }

      // Call the NLP processing endpoint with the user's task input
      const response = await fetch('/api/process-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({ input }),
      });

      // If the response is not OK, throw an error
      if (!response.ok) {
        throw new Error('Failed to process task');
      }

      // Return the response from the NLP processing endpoint
      return response.json();
    },
  });
  */

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

      // Create a simpler task payload with correct fields
      const taskData = {
        title: data.title,
        priority: data.priority || 'medium',
        status: 'pending', // Try 'pending' instead of 'active' as it might be allowed by the constraint
        created_by: session.user.id
      };

      console.log('Session authenticated user ID:', session.user.id);
      console.log('Creating task with minimal data:', JSON.stringify(taskData, null, 2));
      
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

  // This function is called when the form is submitted
  const onSubmit = async (data: TaskFormData) => {
    try {
      // Clear the form error
      setFormError(null);
      
      // Create a new task in the database
      await createTask.mutateAsync(data);
      
      // Call the onTaskCreated callback if it exists
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      // Set the form error to the error message
      setFormError(error instanceof Error ? error.message : 'Failed to create task');
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
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-800">Category</label>
              <div className="space-y-2">
                {Object.entries(CATEGORIES).map(([category]) => (
                  <label key={category} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value={category}
                      id={`category-${category}`}
                      {...register('category')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">
                      {category === 'childcare' ? 'Childcare' :
                       category === 'work' ? 'Work' :
                       category === 'personal' ? 'Personal' :
                       'Other'}
                    </span>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {selectedCategory && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">Subcategory</label>
                <div className="space-y-2">
                  {CATEGORIES[selectedCategory as keyof typeof CATEGORIES].map((sub) => (
                    <label key={sub} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value={sub}
                        id={`subcategory-${sub.replace(/\s+/g, '-').toLowerCase()}`}
                        {...register('subcategory')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{sub}</span>
                    </label>
                  ))}
                </div>
                {errors.subcategory && (
                  <p className="text-sm text-red-600">{errors.subcategory.message}</p>
                )}
              </div>
            )}
          </div>
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
              <label className="block text-sm font-semibold text-gray-800">Estimated Hours</label>
              <input
                type="text"
                min="0"
                max="99"
                placeholder="0"
                {...register('estimatedHours')}
                className={cn(
                  'mt-1 block w-full rounded-lg glass-input shadow-sm',
                  errors.estimatedHours && 'border-red-500'
                )}
              />
              {errors.estimatedHours && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedHours.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800">Estimated Minutes</label>
              <input
                type="text"
                min="0"
                max="59"
                placeholder="0"
                {...register('estimatedMinutes')}
                className={cn(
                  'mt-1 block w-full rounded-lg glass-input shadow-sm',
                  errors.estimatedMinutes && 'border-red-500'
                )}
              />
              {errors.estimatedMinutes && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedMinutes.message}</p>
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