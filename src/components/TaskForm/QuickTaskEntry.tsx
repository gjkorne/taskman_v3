import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTaskActions } from '../../hooks/useTaskActions';
import { TaskStatus } from '../../types/task';

interface QuickTaskEntryProps {
  onTaskCreated?: () => void;
}

/**
 * Quick entry component for adding tasks with minimal input
 * This provides a streamlined way to add tasks without opening the full form
 */
export function QuickTaskEntry({ onTaskCreated }: QuickTaskEntryProps) {
  const [taskTitle, setTaskTitle] = useState('');
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
        updated_at: new Date().toISOString()
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
            <Plus className="w-9 h-9" />
          </button>
        </div>
        
        {/* Desktop: Full input with background */}
        <div className="relative flex-grow hidden md:block">
          <div className="flex items-center px-4 py-3 bg-white border rounded-lg transition-all border-gray-300 hover:border-indigo-400 hover:shadow focus-within:border-indigo-500 focus-within:shadow-md">
            <Plus className="w-5 h-5 text-gray-400 mr-2" />
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
