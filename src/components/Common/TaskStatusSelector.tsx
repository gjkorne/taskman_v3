import React, { useState, useEffect, useRef } from 'react';
import { TaskStatus, TaskStatusType } from '../../types/task';
import { isValidStatusTransition } from '../../utils/taskStatusUtils';
import StatusBadge from './StatusBadge';
import * as Icons from 'lucide-react';

interface TaskStatusSelectorProps {
  currentStatus: TaskStatusType;
  onChange: (newStatus: TaskStatusType) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * TaskStatusSelector component
 * A dropdown selector for task statuses that shows only valid transitions
 */
export const TaskStatusSelector: React.FC<TaskStatusSelectorProps> = ({
  currentStatus,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get valid status transitions based on current status
  const validTransitions = Object.values(TaskStatus).filter(status => 
    isValidStatusTransition(currentStatus, status)
  );
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleStatusChange = (status: TaskStatusType) => {
    onChange(status);
    setIsOpen(false);
  };
  
  // Size-based classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      ref={dropdownRef}
    >
      {/* Current Status (Dropdown Trigger) */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 ${sizeClasses[size]} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <StatusBadge 
          status={currentStatus} 
          size={size}
          showLabel={true}
          showIcon={true}
        />
        {!disabled && (
          <Icons.ChevronDown size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} className="text-gray-500" />
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {validTransitions.map((status) => {
              const isActive = status === currentStatus;
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full text-left px-3 py-2 ${sizeClasses[size]} flex items-center gap-2 hover:bg-gray-50 ${
                    isActive ? 'font-semibold bg-gray-50' : 'font-normal'
                  }`}
                  role="menuitem"
                >
                  <StatusBadge 
                    status={status} 
                    size={size}
                    showLabel={true}
                    showIcon={true}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatusSelector;
