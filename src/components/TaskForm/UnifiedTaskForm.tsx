import { useEffect, useState, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskDebug } from './TaskDebug';
import { TagsInput } from '../Common/TagsInput';
import { Form, FormGroup, FormSection } from '../Common/FormComponents';
import { PrioritySelector } from '../Common/PrioritySelector';
import { CategorySelector } from '../Common/CategorySelector';
import { useTaskForm } from '../../hooks/useTaskForm';
import { NotesEditor } from '../TaskNotes/NotesEditor';
import { getSubcategoriesForCategory } from '../../types/categories';

const isDevelopment = process.env.NODE_ENV !== 'production';

export interface UnifiedTaskFormProps {
  taskId?: string | null;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  initialValues?: {
    title?: string;
    description?: string;
    category_name?: string;
    priority?: string;
    tags?: string[];
    due_date?: string;
    hasDueDate?: boolean;
    estimatedTime?: number;
    status?: string;
    subcategory?: string;
  };
  visibleCategories?: string[]; // List of category names to display as buttons
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
  onClose,
  initialValues,
  visibleCategories
}: UnifiedTaskFormProps) {
  // Merge callbacks for simpler interaction with different parent components
  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };
  
  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };
  
  // Custom hook to manage form state and submission
  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors },
    watch,
    setValue,
    getValues,
    isLoading,
    error
  } = useTaskForm({
    taskId: mode === 'edit' ? taskId : null,
    onSuccess: handleSuccess,
    onError: () => {
      // Custom error handling if needed
    }
  });
  
  // Apply initial values when provided
  useEffect(() => {
    if (initialValues && !taskId) {
      // Only apply initial values for new tasks
      Object.entries(initialValues).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as any, value);
          
          // Special handling for due date
          if (key === 'due_date' && value) {
            setValue('hasDueDate', true);
          }
        }
      });
    }
  }, [initialValues, setValue, taskId]);
  
  // Watch form values for reactive UI updates
  const categoryName = watch('category_name');
  const hasDueDate = watch('hasDueDate');
  const watchedTags = watch('tags') || [];
  
  // Track expanded/collapsed state for the notes field
  const [isNotesExpanded, setIsNotesExpanded] = useState(mode === 'edit');
  
  // Ref for the form container to detect outside clicks
  const formRef = useRef<HTMLDivElement>(null);
  
  // Add a click outside event listener to close the form when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        if (onCancel) onCancel();
        else if (onClose) onClose();
      }
    }
    
    // Attach the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel, onClose]);

  return (
    <div className="w-full" ref={formRef}>
      <Form onSubmit={handleSubmit}>
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
        <FormSection title="Task Details" useGradient={true} hideTitle={true}>
          {/* Title Field */}
          <FormGroup 
            label="Task Title" 
            htmlFor="task-title" 
            required
            error={errors.title?.message}
          >
            <input
              type="text"
              placeholder="What needs to be done?"
              autoFocus={mode === 'create'}
              id="task-title"
              {...register('title')}
              className={cn(
                'mt-1 block w-full rounded-lg border shadow-sm transition-all text-lg p-2 bg-white',
                errors.title ? 'border-red-500' : 'border-gray-300'
              )}
            />
          </FormGroup>
          
          {/* Classification Fields */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Classification</h3>
            
            {/* Category Selection */}
            <FormGroup 
              label="Category"
              htmlFor="category"
              required
              error={errors.category_name?.message}
            >
              <CategorySelector
                value={categoryName || ''}
                onChange={(value) => setValue('category_name', value)}
                error={errors.category_name?.message}
                required={true}
                visibleCategories={visibleCategories}
              />
            </FormGroup>
            
            {/* Subcategory Selection - Only shown when a category is selected */}
            {categoryName && (
              <FormGroup
                label="Subcategory"
                htmlFor="subcategory"
              >
                <select
                  id="subcategory"
                  value={getValues('subcategory') || ''}
                  onChange={(e) => {
                    setValue('subcategory', e.target.value);
                    
                    // Update tags with the subcategory information
                    const currentTags = getValues('tags') || [];
                    const updatedTags = currentTags.filter(tag => !tag.startsWith('subcategory:'));
                    
                    if (e.target.value) {
                      updatedTags.push(`subcategory:${e.target.value}`);
                    }
                    
                    setValue('tags', updatedTags);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Subcategory --</option>
                  {categoryName && getSubcategoriesForCategory(categoryName).map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              </FormGroup>
            )}
            
            {/* Status Field - Only show in edit mode */}
            {mode === 'edit' && (
              <FormGroup
                label="Status"
                htmlFor="status"
                error={errors.status?.message}
              >
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
              </FormGroup>
            )}
          </div>
          
          {/* Notes Field */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                {isNotesExpanded ? 'Notes & Checklist' : 'Notes'}
              </h3>
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
            
            <div className={cn(!isNotesExpanded && 'hidden')}>
              {/* Controller for handling both notes and checklist items in a unified way */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="mt-1">
                    <NotesEditor
                      value={field.value || null}
                      onChange={field.onChange}
                      className="w-full bg-white border rounded-md border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </FormSection>
        
        {/* PRIORITY & TIMING SECTION */}
        <FormSection title="Priority & Timing" useGradient={true} hideTitle={true}>
          {/* Priority Selection */}
          <FormGroup
            label="Priority"
            htmlFor="priority"
            error={errors.priority?.message}
          >
            <PrioritySelector
              value={watch('priority') || 'medium'}
              onChange={(value) => setValue('priority', value)}
              layout="radio"
            />
          </FormGroup>
          
          {/* Estimated Time */}
          <FormGroup
            label="Estimated Time (minutes)"
            htmlFor="estimatedTime"
            error={errors.estimatedTime?.message}
          >
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
            <p className="mt-1 text-xs text-gray-500">Enter total minutes (e.g., 300 for 5 hours)</p>
          </FormGroup>
          
          {/* Due Date Field */}
          <FormGroup
            label="Due Date"
            htmlFor="dueDate"
            error={errors.due_date?.message}
          >
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('hasDueDate')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Has due date</span>
            </div>
            
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
              </div>
            )}
          </FormGroup>
          
          {/* Tags Field */}
          <FormGroup
            label="Tags"
            htmlFor="tags"
          >
            <TagsInput
              value={watchedTags}
              onChange={(tags) => setValue('tags', tags)}
            />
          </FormGroup>
        </FormSection>
        
        {/* Task Creation Diagnostic - Only shown in development */}
        {isDevelopment && <TaskDebug />}
        
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
      </Form>
    </div>
  );
}

export default UnifiedTaskForm;
