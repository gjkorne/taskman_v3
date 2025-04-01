import { useState } from 'react';
import { X, CalendarIcon, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CATEGORIES } from '../../types/categories';
import { useTaskForm } from '../../hooks/useTaskForm';

// Valid category keys for type safety
type CategoryKey = keyof typeof CATEGORIES;

interface TaskEditFormProps {
  taskId: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  onTaskUpdated?: () => void;
}

export function TaskEditForm({ 
  taskId, 
  onSaved, 
  onCancel, 
  onClose, 
  onTaskUpdated
}: TaskEditFormProps) {
  // Tag input state for adding new tags
  const [tagInput, setTagInput] = useState('');
  
  // Merge callbacks to ensure compatibility with different components
  const handleSuccess = () => {
    if (onTaskUpdated) onTaskUpdated();
    if (onSaved) onSaved();
    if (onClose) onClose();
  };
  
  const handleError = () => {
    // Custom error handling if needed
  };
  
  // Use our custom hook for form management
  const { 
    isLoading, 
    error,
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    watch,
    getValues
  } = useTaskForm({
    taskId,
    onSuccess: handleSuccess,
    onError: handleError
  });
  
  // Watch form values for reactive UI updates
  const watchedCategory = watch('category');
  const watchedTags = watch('tags') || [];
  
  // Handle tag input and addition
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Check if tag already exists
    const currentTags = getValues('tags') || [];
    if (!currentTags.includes(tagInput.trim())) {
      setValue('tags', [...currentTags, tagInput.trim()]);
    }
    
    // Clear the tag input
    setTagInput('');
  };
  
  // Remove a tag
  const removeTag = (tag: string) => {
    const currentTags = getValues('tags') || [];
    setValue('tags', currentTags.filter((t: string) => t !== tag));
  };
  
  // Handle enter key on tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          {...register('title')}
          className={cn(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500",
            errors.title ? "border-red-300" : "border-gray-300"
          )}
          placeholder="Task title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>
      
      {/* Status and Priority Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Field */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        
        {/* Priority Field */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            {...register('priority')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="urgent">Urgent (P1)</option>
            <option value="high">High (P2)</option>
            <option value="medium">Medium (P3)</option>
            <option value="low">Low (P4)</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
          )}
        </div>
      </div>
      
      {/* Category and Subcategory Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a category</option>
            {Object.keys(CATEGORIES).map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>
        
        {/* Subcategory Field - Only show if category is selected */}
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
            Subcategory
          </label>
          <select
            id="subcategory"
            {...register('subcategory')}
            disabled={!watchedCategory}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Select a subcategory</option>
            {watchedCategory && CATEGORIES[watchedCategory as CategoryKey]?.map(subcategory => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
          {errors.subcategory && (
            <p className="mt-1 text-sm text-red-600">{errors.subcategory.message}</p>
          )}
        </div>
      </div>
      
      {/* Due Date Field */}
      <div>
        <label htmlFor="hasDueDate" className="flex items-center text-sm font-medium text-gray-700 mb-1">
          <input
            type="checkbox"
            id="hasDueDate"
            {...register('hasDueDate')}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Set Due Date
        </label>
        
        {watch('hasDueDate') && (
          <div className="relative mt-2">
            <input
              id="dueDate"
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        )}
        
        {errors.dueDate && (
          <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
        )}
      </div>
      
      {/* Tags Field */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={addTag}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
        
        {/* Display existing tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {watchedTags.map((tag: string) => (
            <div 
              key={tag} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {tag}
              <button 
                type="button" 
                onClick={() => removeTag(tag)} 
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {watchedTags.length === 0 && (
            <p className="text-sm text-gray-500">No tags added yet</p>
          )}
        </div>
      </div>
      
      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Task description"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            taskId ? 'Update Task' : 'Create Task'
          )}
        </button>
      </div>
    </form>
  );
}
