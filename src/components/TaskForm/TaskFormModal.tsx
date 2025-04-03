import { X } from 'lucide-react';
import { TaskForm } from './index';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  title?: string;
}

/**
 * Modal wrapper for the task form
 * Manages the display and positioning of the task creation/edit form
 */
export function TaskFormModal({
  isOpen,
  onClose,
  onTaskCreated,
  title = 'New Task'
}: TaskFormModalProps) {
  if (!isOpen) return null;
  
  // Handle successful task creation
  const handleTaskCreated = () => {
    onTaskCreated();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Close modal when clicking outside of it
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <TaskForm 
          mode="create"
          onSuccess={handleTaskCreated}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
