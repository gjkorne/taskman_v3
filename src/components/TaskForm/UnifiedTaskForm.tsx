import React from 'react';
import { Controller } from 'react-hook-form';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskDebug } from './TaskDebug';
import { useTaskForm } from '../../hooks/useTaskForm';
import FormSection from '../Common/FormSection';
import CategorySelector from '../Common/CategorySelector';
import PrioritySelector from '../Common/PrioritySelector';
import TagsInput from '../Common/TagsInput';
import NotesEditor from '../TaskNotes/NotesEditor';

const isDevelopment = process.env.NODE_ENV !== 'production';

export interface UnifiedTaskFormProps {
  taskId?: string | null;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

/**
 * UnifiedTaskForm component
 * A single form component that handles both task creation and editing
 */
export function UnifiedTaskForm({
  taskId = null,
  mode = 'create',
  onSuccess,
  onCancel,
  onClose
}: UnifiedTaskFormProps) {
  // Track expanded/collapsed state for the notes field
  const [isNotesExpanded, setIsNotesExpanded] = React.useState(mode === 'edit');
  
  // Merge callbacks for simpler interaction with different parent components
  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };
  
  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };
  
  // Use our custom hook for form management
  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors },
    watch,
    setValue,
    isLoading,
    error
  } = useTaskForm({
    taskId: mode === 'edit' ? taskId : null,
    onSuccess: handleSuccess,
    onError: () => {
      // Custom error handling if needed
    }
  });
  
  // Watch form values for reactive UI updates
  const categoryName = watch('category_name');
  const hasDueDate = watch('hasDueDate');
  // const subcategory = watch('subcategory'); // Remove or comment out unused variable
  const watchedTags = watch('tags') || [];
  
  return (
    <div className="w-full">
      {isDevelopment && <TaskDebug />}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* TASK DETAILS SECTION */}
        <FormSection title="Task Details" useGradient={true}>
          {/* Title Field */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-semibold text-gray-800">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              autoFocus={mode === 'create'}
              id="task-title"
              {...register('title')}
              className={cn(
                'mt-1 block w-full rounded-lg glass-input shadow-sm transition-all text-lg p-2',
                errors.title ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          {/* Notes Field */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="task-notes" className="block text-sm font-semibold text-gray-800">
                Notes
              </label>
              <button
                type="button"
                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                className="flex items-center text-xs text-gray-500 hover:text-gray-700"
              >
                {isNotesExpanded ? (
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
            
            <div className={cn(!isNotesExpanded && 'hidden', 'border border-gray-300 rounded-md overflow-hidden')}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <NotesEditor 
                    value={field.value || ''} 
                    onChange={field.onChange} 
                  />
                )}
              />
            </div>
          </div>
        </FormSection>
        
        {/* CLASSIFICATION SECTION */}
        <FormSection title="Classification" useGradient={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Selection */}
            <CategorySelector
              value={categoryName || ''}
              onChange={(value) => setValue('category_name', value)}
              error={errors.category_name?.message}
            />
            
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
          
          {/* Status Field - Only show in edit mode */}
          {mode === 'edit' && (
            <div className="mt-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          )}
        </FormSection>
        
        {/* PRIORITY & TIMING SECTION */}
        <FormSection title="Priority & Timing" useGradient={true}>
          {/* Priority Selection */}
          <PrioritySelector
            value={watch('priority') || 'medium'}
            onChange={(value) => setValue('priority', value)}
            layout="radio"
            error={errors.priority?.message}
          />
          
          {/* Due Date Field */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('hasDueDate')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Has due date</span>
            </label>
            
            {hasDueDate && (
              <div className="mt-2">
                <input
                  type="date"
                  {...register('due_date')}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md',
                    errors.due_date ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Tags Field */}
          <TagsInput
            value={watchedTags}
            onChange={(tags) => setValue('tags', tags)}
          />
        </FormSection>
        
        {/* FORM ACTIONS */}
        <div className="flex justify-end space-x-3">
          {/* Cancel Button - Only show if we have a cancel handler */}
          {(onCancel || onClose) && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'edit' ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              mode === 'edit' ? 'Update Task' : 'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UnifiedTaskForm;
