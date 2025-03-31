import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Flag, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RichTextEditor } from '../TaskForm/RichTextEditor';

// Define the categories (same as in TaskForm)
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
    'Home & Environment',
    'Finances',
    'Recreation & Leisure',
    'Personal Growth'
  ]
} as const;

// Define the schema for task editing
const taskEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional().nullable(),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type TaskEditData = z.infer<typeof taskEditSchema>;

interface TaskEditFormProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    category?: string;
    subcategory?: string;
    tags?: string[];
  };
  onClose: () => void;
  onTaskUpdated: () => void;
}

export function TaskEditForm({ task, onClose, onTaskUpdated }: TaskEditFormProps) {
  // State for UI elements
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(!!task.description);
  const [formError, setFormError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TaskEditData>({
    resolver: zodResolver(taskEditSchema),
    defaultValues: {
      title: task.title || '',
      notes: task.description || '',
      status: task.status || 'active',
      priority: task.priority || 'medium',
      category: task.category || '',
      subcategory: task.subcategory || '',
      tags: task.tags || [],
    },
  });

  // Watch for category changes to update subcategory options
  const selectedCategory = watch('category') as keyof typeof CATEGORIES | undefined;

  // Handle task update
  const onSubmit = async (data: TaskEditData) => {
    try {
      setFormError(null);

      const { error } = await supabase
        .from('tasks')
        .update({
          title: data.title,
          description: data.notes,
          status: data.status,
          priority: data.priority,
          tags: data.tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (error) throw error;

      // Call the onTaskUpdated callback
      onTaskUpdated();
      
      // Close the form
      onClose();
    } catch (error: any) {
      console.error('Error updating task:', error);
      setFormError(error.message || 'Failed to update task');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Edit Task</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* TASK INFORMATION */}
          <div className="space-y-6 form-card p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Task Detail</h3>
            
            <div>
              <label htmlFor="edit-task-title" className="block text-sm font-semibold text-gray-800">Task Title</label>
              <input
                type="text"
                id="edit-task-title"
                placeholder="What needs to be done?"
                {...register('title')}
                className={cn(
                  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500',
                  errors.title && 'border-red-500'
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="edit-task-notes" className="block text-sm font-semibold text-gray-800">
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
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor id="edit-task-notes" value={field.value || ''} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </div>

          {/* STATUS & PRIORITY */}
          <div className="space-y-6 form-card p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Status & Priority</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">Status</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="edit-status-active"
                      value="active"
                      {...register('status')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">Active</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="edit-status-in-progress"
                      value="in_progress"
                      {...register('status')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">In Progress</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="edit-status-completed"
                      value="completed"
                      {...register('status')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">Completed</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">Priority Level</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="edit-priority-urgent"
                      value="urgent"
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
                      id="edit-priority-high"
                      value="high"
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
                      id="edit-priority-medium"
                      value="medium"
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
                      id="edit-priority-low"
                      value="low"
                      {...register('priority')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="flex items-center space-x-2 text-sm text-gray-900">
                      <Flag className="w-4 h-4 text-green-500" />
                      <span>P4 (Low)</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* CATEGORY - optional for initial implementation */}
          {selectedCategory && (
            <div className="space-y-6 form-card p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Classification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">Category</label>
                  <div className="space-y-2">
                    {Object.entries(CATEGORIES).map(([category]) => (
                      <label key={category} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          value={category}
                          id={`edit-category-${category}`}
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
                </div>

                {selectedCategory && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-800">Subcategory</label>
                    <div className="space-y-2">
                      {CATEGORIES[selectedCategory].map((sub) => (
                        <label key={sub} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            value={sub}
                            id={`edit-subcategory-${sub.replace(/\s+/g, '-').toLowerCase()}`}
                            {...register('subcategory')}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900">{sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
