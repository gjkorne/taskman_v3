import React from 'react';
import { Flag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskPriority, TaskPriorityType } from '../../types/task';

interface PrioritySelectorProps {
  value: TaskPriorityType;
  onChange: (value: TaskPriorityType) => void;
  layout?: 'dropdown' | 'radio';
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * PrioritySelector component
 * Provides consistent UI for selecting task priority levels
 */
export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  layout = 'radio',
  disabled = false,
  error,
  required = false,
  className = ''
}) => {
  // Priority options with labels and colors
  const priorityOptions = [
    { value: TaskPriority.URGENT, label: 'P1 (Urgent)', color: 'text-red-500' },
    { value: TaskPriority.HIGH, label: 'P2 (High)', color: 'text-yellow-500' },
    { value: TaskPriority.MEDIUM, label: 'P3 (Medium)', color: 'text-blue-500' },
    { value: TaskPriority.LOW, label: 'P4 (Low)', color: 'text-green-500' }
  ];

  // Radio layout
  if (layout === 'radio') {
    return (
      <div className={className}>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Priority Level {required && <span className="text-red-500">*</span>}
        </label>
        <div className="space-y-2">
          {priorityOptions.map(option => (
            <label 
              key={option.value} 
              className="flex items-center space-x-3 p-2 rounded-md bg-white border border-gray-200"
            >
              <input
                type="radio"
                name="priority"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value as TaskPriorityType)}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="flex items-center space-x-2 text-sm text-gray-900">
                <Flag className={cn("w-4 h-4", option.color)} />
                <span>{option.label}</span>
              </span>
            </label>
          ))}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Dropdown layout
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Priority {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TaskPriorityType)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 border rounded-md",
          error ? "border-red-500" : "border-gray-300",
          disabled ? "bg-gray-100 cursor-not-allowed" : "focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        )}
      >
        <option value="" disabled>Select priority</option>
        {priorityOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PrioritySelector;
