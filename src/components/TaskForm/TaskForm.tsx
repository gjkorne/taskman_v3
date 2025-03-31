import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, taskInputSchema, type TaskFormData, type TaskInputData } from './schema';
import { RichTextEditor } from './RichTextEditor';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

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

export function TaskForm() {
  const [taskInput, setTaskInput] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [nlpSuggestions, setNlpSuggestions] = React.useState(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
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

  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const selectedCategory = watch('category');
  const hasDueDate = watch('hasDueDate');
  const [formError, setFormError] = React.useState<string | null>(null);

  const processTaskInput = useMutation({
    mutationFn: async (input: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to process tasks');
      }

      // Call your NLP processing endpoint here
      const response = await fetch('/api/process-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to process task');
      }

      return response.json();
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const hours = data.estimatedHours?.trim() || '0';
      const minutes = data.estimatedMinutes.padStart(2, '0');
      const estimatedTime = `${hours.padStart(2, '0')}:${minutes}`;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to create tasks');
      }

      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: data.title,
          priority: data.priority,
          due_date: data.hasDueDate ? new Date(data.dueDate!).toISOString() : null,
          estimated_time: estimatedTime,
          description: data.description,
          tags: data.context,
          created_by: user.id,
        }]);

      if (error) throw error;
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setFormError('You must be logged in to create tasks');
        return;
      }
      
      setFormError(null);
      await createTask.mutateAsync(data);
      // Could add success message or redirect here
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create task');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {formError && (
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
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quick Task Input
          </label>
          <div className="relative">
            <textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Describe your task naturally, e.g.: 'Schedule a team meeting for next Tuesday at 2pm to discuss the Q2 roadmap'"
              className="w-full h-24 p-3 rounded-lg glass-input"
            />
            <button
              type="button"
              onClick={() => processTaskInput.mutate(taskInput)}
              disabled={processTaskInput.isPending || !taskInput}
              className={cn(
                "absolute bottom-2 right-2 px-3 py-1 rounded-md text-sm",
                "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
                "hover:from-indigo-700 hover:to-purple-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {processTaskInput.isPending ? 'Processing...' : 'Process'}
            </button>
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="What needs to be done?"
            autoFocus
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

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-800"
          >
            <span>Description</span>
            {isDescriptionExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <div
            className={cn(
              'transition-all duration-200 ease-in-out overflow-hidden',
              isDescriptionExpanded ? 'max-h-96 mt-2' : 'max-h-0'
            )}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor value={field.value || ''} onChange={field.onChange} />
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
                value="high"
                {...register('priority')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="flex items-center space-x-2 text-sm text-gray-900">
                <Flag className="w-4 h-4 text-red-500" />
                <span>P1 (High)</span>
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                value="medium"
                {...register('priority')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="flex items-center space-x-2 text-sm text-gray-900">
                <Flag className="w-4 h-4 text-yellow-500" />
                <span>P2 (Medium)</span>
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                value="low"
                {...register('priority')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="flex items-center space-x-2 text-sm text-gray-900">
                <Flag className="w-4 h-4 text-blue-500" />
                <span>P3 (Low)</span>
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

      {/* ASSIGNMENT */}
      <div className="space-y-6 form-card p-6">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Assignment</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800">Location</label>
            <input
              type="text"
              {...register('location')}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
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
  );
}