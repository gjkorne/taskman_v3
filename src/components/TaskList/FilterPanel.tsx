import { useState } from 'react';
import { ChevronDown, ChevronUp, Flag, Filter, CheckCircle, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CATEGORIES } from '../../types/categories';

// Define the filter types
export type TaskFilter = {
  status: string[];
  priority: string[];
  category: string[];
  dueDate: string[]; // Add due date filtering options
  sortBy: 'priority' | 'dueDate' | 'createdAt' | 'title' | 'status' | 'category' | 'lastActive';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
  showCompleted: boolean;
};

// Default filter values
export const defaultFilters: TaskFilter = {
  status: [], // No default status filters
  priority: [],
  category: [],
  dueDate: [],
  sortBy: 'lastActive', // Make 'lastActive' the default sort
  sortOrder: 'desc',
  viewMode: 'list',
  showCompleted: false,
};

interface FilterPanelProps {
  filters: TaskFilter;
  onChange: (filters: TaskFilter) => void;
  onReset?: () => void;
  taskCount?: number;
  filteredCount?: number;
  // Keep these for backward compatibility
  onFilterChange?: (filters: TaskFilter) => void;
  onResetFilters?: () => void;
}

export function FilterPanel({ 
  filters, 
  onChange, 
  onReset,
  taskCount,
  filteredCount,
  onFilterChange, 
  onResetFilters 
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use the right callback based on what's provided
  const handleFilterChange = onChange || onFilterChange;
  const handleReset = onReset || onResetFilters;

  // Helper function to toggle a filter value
  const toggleFilter = (type: keyof TaskFilter, value: string) => {
    if (type === 'status' || type === 'priority' || type === 'category' || type === 'dueDate') {
      const currentValues = [...filters[type]];
      const index = currentValues.indexOf(value);
      
      if (index === -1) {
        // Add the value if it's not already included
        currentValues.push(value);
      } else {
        // Remove the value if it's already included
        currentValues.splice(index, 1);
      }
      
      handleFilterChange({
        ...filters,
        [type]: currentValues
      });
    }
  };

  // Toggle the showCompleted filter
  const toggleShowCompleted = () => {
    handleFilterChange({
      ...filters,
      showCompleted: !filters.showCompleted
    });
  };

  // Update the sort options
  const updateSort = (sortBy: TaskFilter['sortBy']) => {
    if (sortBy === filters.sortBy) {
      // If the same sort field is selected, toggle the sort order
      handleFilterChange({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // If a new sort field is selected, set it with default order
      handleFilterChange({
        ...filters,
        sortBy,
        sortOrder: 'desc' // Default to descending
      });
    }
  };

  // Determine if any filters are active
  const hasActiveFilters = 
    filters.status.length > 0 || 
    filters.priority.length > 0 || 
    filters.category.length > 0 || 
    filters.dueDate.length > 0 || 
    filters.showCompleted !== defaultFilters.showCompleted ||
    filters.sortBy !== defaultFilters.sortBy ||
    filters.sortOrder !== defaultFilters.sortOrder;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">Filters</span>
        </div>
        
        <div className="flex space-x-2">
          {/* Show count of filtered tasks if provided */}
          {taskCount !== undefined && filteredCount !== undefined && (
            <span className="text-sm text-gray-500">
              {filteredCount} / {taskCount}
            </span>
          )}
          
          {/* Reset filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Reset
            </button>
          )}
          
          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Filter sections - only shown when expanded */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Status filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Status
            </h4>
            <div className="space-y-1">
              {['pending', 'active', 'in_progress', 'completed', 'archived'].map((status) => (
                <label key={status} className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={() => toggleFilter('status', status)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Show completed toggle */}
          <div>
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={filters.showCompleted}
                onChange={toggleShowCompleted}
                className="h-4 w-4 text-indigo-600 rounded"
              />
              <span>Include completed tasks</span>
            </label>
          </div>

          {/* Priority filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Flag className="h-4 w-4 text-red-500 mr-1" />
              Priority
            </h4>
            <div className="space-y-1">
              {[
                { value: 'urgent', label: 'Urgent (P1)', color: 'text-red-500' },
                { value: 'high', label: 'High (P2)', color: 'text-orange-500' },
                { value: 'medium', label: 'Medium (P3)', color: 'text-blue-500' },
                { value: 'low', label: 'Low (P4)', color: 'text-green-500' }
              ].map(({ value, label, color }) => (
                <label key={value} className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(value)}
                    onChange={() => toggleFilter('priority', value)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="flex items-center">
                    <Flag className={`h-3 w-3 ${color} mr-1`} />
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Category filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
            <div className="space-y-1">
              {Object.keys(CATEGORIES).map((category) => (
                <label key={category} className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={() => toggleFilter('category', category)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="capitalize">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Due date filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="h-4 w-4 text-purple-500 mr-1" />
              Due Date
            </h4>
            <div className="space-y-1">
              {[
                { value: 'overdue', label: 'Overdue' },
                { value: 'today', label: 'Due Today' },
                { value: 'tomorrow', label: 'Due Tomorrow' },
                { value: 'this_week', label: 'Due This Week' },
                { value: 'next_week', label: 'Due Next Week' },
                { value: 'no_date', label: 'No Due Date' }
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={filters.dueDate.includes(value)}
                    onChange={() => toggleFilter('dueDate', value)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sort By</h4>
            <div className="space-y-1">
              {[
                { value: 'priority', label: 'Priority' },
                { value: 'dueDate', label: 'Due Date' },
                { value: 'createdAt', label: 'Creation Date' },
                { value: 'title', label: 'Title' },
                { value: 'status', label: 'Status' },
                { value: 'category', label: 'Category' },
                { value: 'lastActive', label: 'Last Active' }
              ].map(({ value, label }) => (
                <label 
                  key={value} 
                  className={cn(
                    "flex items-center space-x-2 text-sm cursor-pointer",
                    filters.sortBy === value ? "text-indigo-600 font-medium" : "text-gray-600"
                  )}
                  onClick={() => updateSort(value as TaskFilter['sortBy'])}
                >
                  <input
                    type="radio"
                    checked={filters.sortBy === value}
                    onChange={() => {}} // Handled by the label click
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span>{label}</span>
                  
                  {filters.sortBy === value && (
                    <span className="ml-auto text-indigo-600">
                      {filters.sortOrder === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
