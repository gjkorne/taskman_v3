import React from 'react';
import { Controller } from 'react-hook-form';
import { AlertCircle, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskDebug } from './TaskDebug';
import { useTaskForm } from '../../hooks/useTaskForm';
import { useCategories } from '../../contexts/CategoryContext';
import NotesEditor from '../TaskNotes/NotesEditor';

const isDevelopment = process.env.NODE_ENV !== 'production';

export function TaskForm({ onTaskCreated }: { onTaskCreated?: () => void }) {
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
    onSuccess: onTaskCreated
  });

  // Get categories from context
  const { categories, getBuiltInCategories } = useCategories();
  const builtInCategories = getBuiltInCategories();
  
  // Watch specific form fields for conditional rendering
  const categoryName = watch('category_name') as string | undefined;
  const hasDueDate = watch('hasDueDate');
  const selectedSubcategory = watch('subcategory');

  // This state is used to track whether the description is expanded or not
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  // Get the selected category object if it's a custom category
  const selectedCategory = categories.find(cat => 
    cat.name.toLowerCase() === categoryName?.toLowerCase()
  );
  
  // Get subcategories based on selection
  const getAvailableSubcategories = () => {
    // For custom categories
    if (selectedCategory?.subcategories) {
      return selectedCategory.subcategories;
    }
    
    // For built-in categories
    if (categoryName && categoryName in builtInCategories) {
      return builtInCategories[categoryName as keyof typeof builtInCategories];
    }
    
    return [];
  };
  
  const subcategories = getAvailableSubcategories();

  // Handle subcategory selection
  const handleSubcategoryChange = (subcategory: string) => {
    setValue('subcategory', subcategory);
  };
  
  // Handle category selection
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    
    // Clear subcategory when changing categories
    setValue('subcategory', '');
    
    // Check if it's a custom category (starts with "custom:")
    if (value.startsWith('custom:')) {
      const categoryId = value.replace('custom:', '');
      
      // Find the category name for this ID
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        setValue('category_name', category.name);
      } else {
        setValue('category_name', '');
      }
    } else if (value) {
      // It's a built-in category
      setValue('category_name', value);
    } else {
      // No category selected
      setValue('category_name', '');
    }
  };

  return (
    <div className="w-full">
      {isDevelopment && <TaskDebug />}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          // Display the form error if there is one
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
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
                  <NotesEditor 
                    value={field.value || ''} 
                    onChange={field.onChange} 
                  />
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
                Category
              </label>
              <select
                onChange={handleCategoryChange}
                value={selectedCategory ? `custom:${selectedCategory.id}` : categoryName || ''}
                className={cn(
                  "w-full px-3 py-2 border rounded-md",
                  errors.category_name ? "border-red-500" : "border-gray-300"
                )}
              >
                <option value="">-- Select Category (Optional) --</option>
                
                {/* Built-in categories */}
                <optgroup label="Default Categories">
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="childcare">Childcare</option>
                  <option value="other">Other</option>
                </optgroup>
                
                {/* User-defined categories */}
                {categories.length > 0 && (
                  <optgroup label="My Categories">
                    {categories.map(cat => (
                      <option key={cat.id} value={`custom:${cat.id}`}>
                        {cat.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {errors.category_name && (
                <p className="mt-1 text-sm text-red-500">{errors.category_name.message}</p>
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
          {categoryName && subcategories.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subcategories.map((subcategory) => (
                  <label 
                    key={subcategory} 
                    className={cn(
                      "flex items-center space-x-2 p-2 border rounded-md",
                      selectedSubcategory === subcategory 
                        ? "bg-blue-50 border-blue-200" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      value={subcategory}
                      checked={selectedSubcategory === subcategory}
                      onChange={() => handleSubcategoryChange(subcategory)}
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
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="px-6 py-3 border border-transparent rounded-lg shadow-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}