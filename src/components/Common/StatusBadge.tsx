import React from 'react';
import { TaskStatusType } from '../../types/task';
import { getStatusDisplayConfig } from '../../utils/taskStatusUtils';
import * as Icons from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

/**
 * StatusBadge component
 * Renders a consistent status badge with optional icon and label
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className = '',
}) => {
  const config = getStatusDisplayConfig(status);
  
  // Size-based classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 rounded',
    md: 'text-sm px-2 py-1 rounded-md',
    lg: 'text-base px-3 py-1.5 rounded-lg',
  };
  
  // Icon size based on badge size
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };
  
  // Get the appropriate icon component
  const IconComponent = Icons[config.icon as keyof typeof Icons] || Icons.Circle;
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${config.bgColor} ${sizeClasses[size]} ${className}`}
      data-status={status}
    >
      {showIcon && (
        <IconComponent 
          size={iconSizes[size]} 
          className={config.color}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
      
      {showLabel && (
        <span className={`font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;
