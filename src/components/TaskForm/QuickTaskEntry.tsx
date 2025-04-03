import React, { useState } from 'react';
import { useTaskActions } from '../../hooks/useTaskActions';
import { TaskStatus } from '../../types/task';
import { Icon } from '../UI/Icon';

/**
 * Quick entry component for adding tasks with minimal input
 * This provides a streamlined way to add tasks without opening the full form
 */
export function QuickTaskEntry({ onTaskCreated }: QuickTaskEntryProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('work'); // Default to 'work' category
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTask } = useTaskActions({
    refreshTasks: async () => {
      if (onTaskCreated) onTaskCreated();
    },
    showToasts: true
  });

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
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="w-full mb-2">
          <h3 className="text-sm font-medium text-gray-600">Choose category:</h3>
        </div>
        <label className={`flex items-center px-3 py-1.5 rounded-md cursor-pointer transition-colors border ${
          selectedCategory === 'work' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}>
          <input
            type="radio"
            name="quick-category"
            value="work"
            checked={selectedCategory === 'work'}
            onChange={() => setSelectedCategory('work')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
          />
          <span 
            className="inline-block w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: '#3B82F6' }}
          ></span>
          <span className="text-sm font-medium">Work</span>
        </label>
        <label className={`flex items-center px-3 py-1.5 rounded-md cursor-pointer transition-colors border ${
          selectedCategory === 'personal' ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}>
          <input
            type="radio"
            name="quick-category"
            value="personal"
            checked={selectedCategory === 'personal'}
            onChange={() => setSelectedCategory('personal')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
          />
          <span 
            className="inline-block w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: '#8B5CF6' }}
          ></span>
          <span className="text-sm font-medium">Personal</span>
        </label>
        <label className={`flex items-center px-3 py-1.5 rounded-md cursor-pointer transition-colors border ${
          selectedCategory === 'childcare' ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}>
          <input
            type="radio"
            name="quick-category"
            value="childcare"
            checked={selectedCategory === 'childcare'}
            onChange={() => setSelectedCategory('childcare')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
          />
          <span 
            className="inline-block w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: '#10B981' }}
          ></span>
          <span className="text-sm font-medium">Childcare</span>
        </label>
        <label className={`flex items-center px-3 py-1.5 rounded-md cursor-pointer transition-colors border ${
          selectedCategory === 'other' ? 'bg-amber-100 border-amber-300' : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}>
          <input
            type="radio"
            name="quick-category"
            value="other"
            checked={selectedCategory === 'other'}
            onChange={() => setSelectedCategory('other')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
          />
          <span 
            className="inline-block w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: '#F59E0B' }}
          ></span>
          <span className="text-sm font-medium">Other</span>
        </label>
      </div>

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
