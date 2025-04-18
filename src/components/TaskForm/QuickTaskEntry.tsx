import React, { useState, useEffect } from 'react';
import { useTaskActions } from '../../hooks/useTaskActions';
import { TaskStatus } from '../../types/task';
import { Icon } from '../UI/Icon';
import { useSettings } from '../../contexts/SettingsCompat';
import { useCategories } from '../../contexts/category';

/**
 * Quick entry component for adding tasks with minimal input
 * This provides a streamlined way to add tasks without opening the full form
 */
export function QuickTaskEntry({ onTaskCreated }: QuickTaskEntryProps) {
  const { settings } = useSettings();
  const { categories } = useCategories();
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(settings.defaultQuickTaskCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected category if default changes in settings
  useEffect(() => {
    setSelectedCategory(settings.defaultQuickTaskCategory);
  }, [settings.defaultQuickTaskCategory]);

  const { createTask } = useTaskActions({
    refreshTasks: async () => {
      if (onTaskCreated) onTaskCreated();
    },
    showToasts: true
  });

  // Get the color for a category
  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(
      cat => cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    // Return the category color or a default color
    return category?.color || getDefaultCategoryColor(categoryName);
  };

  // Get default colors for standard categories
  const getDefaultCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'work':
        return '#3B82F6'; // blue-500
      case 'personal':
        return '#8B5CF6'; // purple-500
      case 'childcare':
        return '#10B981'; // green-500
      case 'other':
        return '#F59E0B'; // amber-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskTitle.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      await createTask({
        title: taskTitle.trim(),
        status: TaskStatus.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: selectedCategory || undefined
      });
      
      // Clear input after successful creation
      setTaskTitle('');
      
      // Call the callback to refresh tasks
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      {/* Category Radio Buttons */}
      {settings.quickTaskCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="w-full mb-2">
            <h3 className="text-sm font-medium text-gray-600">Choose category:</h3>
          </div>
          {settings.quickTaskCategories.map(category => (
            <label 
              key={category}
              className={`flex items-center px-3 py-1.5 rounded-md cursor-pointer transition-colors border ${
                selectedCategory === category 
                  ? 'bg-opacity-10 border-opacity-50' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: selectedCategory === category ? `${getCategoryColor(category)}20` : '',
                borderColor: selectedCategory === category ? getCategoryColor(category) : ''
              }}
            >
              <input
                type="radio"
                name="quick-category"
                value={category}
                checked={selectedCategory === category}
                onChange={() => setSelectedCategory(category)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
              />
              <span 
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: getCategoryColor(category) }}
              ></span>
              <span className="text-sm font-medium capitalize">{category}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center">
        {/* Mobile: Large prominent icon */}
        <div className="md:hidden flex justify-center w-full py-2">
          <button
            type="button"
            onClick={() => {
              // This would typically open a modal or form
              // For now, we'll focus the input when clicked on mobile
              const inputElement = document.querySelector('input[placeholder="Add a new task..."]');
              if (inputElement) {
                (inputElement as HTMLElement).focus();
              }
            }}
            className="w-16 h-16 flex items-center justify-center text-white bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 animate-pulse-subtle"
            aria-label="Add a new task"
          >
            <Icon name="Plus" size={24} />
          </button>
        </div>
        
        {/* Desktop: Full input with background */}
        <div className="relative flex-grow hidden md:block">
          <div className="flex items-center px-4 py-3 bg-white border rounded-lg transition-all border-gray-300 hover:border-indigo-400 hover:shadow focus-within:border-indigo-500 focus-within:shadow-md">
            <Icon name="Plus" size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Add a new task..."
              className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          className="hidden md:block ml-2 px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          disabled={isSubmitting || !taskTitle.trim()}
        >
          Add Task
        </button>
      </div>
    </form>
  );
}

interface QuickTaskEntryProps {
  onTaskCreated?: () => void;
}
