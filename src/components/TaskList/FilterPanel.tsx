import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Flag, Filter, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Define the filter types
export type TaskFilter = {
  status: string[];
  priority: string[];
  category: string[];
  sortBy: 'priority' | 'dueDate' | 'createdAt' | 'title' | 'status' | 'category';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
  showCompleted: boolean;
};

// Default filter values
export const defaultFilters: TaskFilter = {
  status: [], // No default status filters
  priority: [],
  category: [],
  sortBy: 'priority',
  sortOrder: 'desc',
  viewMode: 'list',
  showCompleted: false,
};

interface FilterPanelProps {
  filters: TaskFilter;
  onFilterChange: (filters: TaskFilter) => void;
  onResetFilters: () => void;
}

export function FilterPanel({ filters, onFilterChange, onResetFilters }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to toggle a filter value
  const toggleFilter = (type: keyof TaskFilter, value: string) => {
    if (type === 'status' || type === 'priority' || type === 'category') {
      const currentValues = filters[type];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      onFilterChange({
        ...filters,
        [type]: newValues
      });
    }
  };

  // Set sort option
  const setSortOption = (option: TaskFilter['sortBy']) => {
    // If clicking the same option, toggle the order
    if (filters.sortBy === option) {
      onFilterChange({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // New sort option, use default order (desc for priority, asc for others)
      onFilterChange({
        ...filters,
        sortBy: option,
        sortOrder: option === 'priority' ? 'desc' : 'asc'
      });
    }
  };

  // Toggle show completed
  const toggleShowCompleted = () => {
    onFilterChange({
      ...filters,
      showCompleted: !filters.showCompleted
    });
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden transition-all">
      {/* Filter Header */}
      <div 
        className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-indigo-500" />
          <span className="font-medium text-gray-700">Filters & Sort</span>
          {(filters.status.length > 0 || filters.priority.length > 0 || filters.category.length > 0) && (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Reset filters button - only show if filters are active */}
          {(filters.status.length > 0 || filters.priority.length > 0 || filters.category.length > 0) && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onResetFilters();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </button>
          )}
          
          {/* Expand/collapse icon */}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-3 py-2 border-t border-gray-100">
          {/* Section Headings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
            <div>
              <h3 className="text-sm font-semibold text-indigo-600 px-2 pb-1 border-b border-indigo-200 inline-block">
                Filters
              </h3>
            </div>
            <div className="text-right md:text-left">
              <h3 className="text-sm font-semibold text-indigo-600 px-2 pb-1 border-b border-indigo-200 inline-block">
                Sort Options
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* FILTERS SECTION */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Status Filter */}
                <div className="bg-gray-50 p-2 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-700 mb-1">Status</h3>
                  <div className="space-y-1">
                    {['active', 'in_progress', 'pending'].map(status => (
                      <label key={status} className="flex items-center space-x-1 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={() => toggleFilter('status', status)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                        />
                        <span className="text-gray-600 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div className="bg-gray-50 p-2 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-700 mb-1">Priority</h3>
                  <div className="space-y-1">
                    {['urgent', 'high', 'medium', 'low'].map(priority => (
                      <label key={priority} className="flex items-center space-x-1 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(priority)}
                          onChange={() => toggleFilter('priority', priority)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                        />
                        <span className="text-gray-600 capitalize flex items-center">
                          <Flag className={cn(
                            "h-2.5 w-2.5 mr-0.5",
                            priority === 'urgent' && "text-red-500",
                            priority === 'high' && "text-yellow-500",
                            priority === 'medium' && "text-blue-500",
                            priority === 'low' && "text-green-500",
                          )} />
                          {priority}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="bg-gray-50 p-2 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-700 mb-1">Category</h3>
                  <div className="space-y-1">
                    {['work', 'personal', 'childcare'].map(category => (
                      <label key={category} className="flex items-center space-x-1 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={filters.category.includes(category)}
                          onChange={() => toggleFilter('category', category)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                        />
                        <span className="text-gray-600 capitalize">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Show Completed - as a subsection with highlight */}
              <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 mt-2">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showCompleted}
                    onChange={toggleShowCompleted}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                    id="show-completed"
                  />
                  <label htmlFor="show-completed" className="text-xs font-medium text-indigo-700 cursor-pointer flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-indigo-600" />
                    Show completed tasks
                  </label>
                </div>
              </div>
            </div>

            {/* SORT SECTION */}
            <div>
              {/* Sort Options */}
              <div className="bg-gray-50 p-2 rounded-lg">
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'priority', label: 'Priority' },
                    { id: 'dueDate', label: 'Due Date' },
                    { id: 'createdAt', label: 'Created' },
                    { id: 'title', label: 'Title' },
                    { id: 'status', label: 'Status' },
                    { id: 'category', label: 'Category' },
                  ].map(sort => (
                    <label 
                      key={sort.id} 
                      className={cn(
                        "flex items-center space-x-1 cursor-pointer px-2 py-1 rounded text-xs",
                        filters.sortBy === sort.id 
                          ? "bg-indigo-100 text-indigo-800" 
                          : "hover:bg-gray-100"
                      )}
                    >
                      <input
                        type="radio"
                        checked={filters.sortBy === sort.id}
                        onChange={() => setSortOption(sort.id as TaskFilter['sortBy'])}
                        className="text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                      />
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">
                          {sort.label}
                        </span>
                        {filters.sortBy === sort.id && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSortOption(sort.id as TaskFilter['sortBy']);
                            }}
                            className="p-0.5 rounded-full hover:bg-indigo-200"
                          >
                            {filters.sortOrder === 'asc' 
                              ? <ChevronUp className="h-3 w-3 text-indigo-700" />
                              : <ChevronDown className="h-3 w-3 text-indigo-700" />
                            }
                          </button>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
