import React, { useState } from 'react';
import { 
  Filter, Search, SortAsc, SortDesc, Calendar, Flag, 
  CheckCircle, Clock, Layers, ChevronDown, ChevronUp, X 
} from 'lucide-react';
import { useFilterSort } from '../../contexts/filterSort';
import { cn } from '../../lib/utils';

interface FilterBarProps {
  showTaskCount?: boolean;
  taskCount?: number;
  filteredCount?: number;
  className?: string;
}

export function FilterBar({
  showTaskCount = true,
  taskCount = 0,
  filteredCount = 0,
  className
}: FilterBarProps) {
  const { 
    filters, 
    clearFilters,
    sortCriteria,
    setSortCriteria,
    groupBy,
    setGroupBy,
    applyQuickFilter,
    searchQuery,
    setSearchQuery
  } = useFilterSort();
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Helper to check if a particular quick filter is active
  const isQuickFilterActive = (filterName: string): boolean => {
    // Each quick filter has a corresponding filter criteria pattern
    switch (filterName) {
      case 'high-priority':
        return filters.some(f => 
          f.field === 'priority' && f.operator === 'in' && 
          Array.isArray(f.value) && f.value.includes('high')
        );
      case 'due-today':
        return filters.some(f => 
          f.field === 'due_date' && f.operator === 'eq' && 
          f.value === 'today'
        );
      case 'overdue':
        return filters.some(f => 
          f.field === 'due_date' && f.operator === 'lt' && 
          f.value === 'today'
        );
      case 'work':
        return filters.some(f => 
          f.field === 'category_name' && f.operator === 'in' && 
          Array.isArray(f.value) && f.value.includes('Work')
        );
      case 'personal':
        return filters.some(f => 
          f.field === 'category_name' && f.operator === 'in' && 
          Array.isArray(f.value) && f.value.includes('Personal')
        );
      default:
        return false;
    }
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortCriteria({
      ...sortCriteria,
      direction: sortCriteria.direction === 'asc' ? 'desc' : 'asc'
    });
  };
  
  // Change sort field
  const changeSortField = (field: string) => {
    setSortCriteria({
      field,
      direction: sortCriteria.direction
    });
  };
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Handle group by selection
  const handleGroupByChange = (field: string | null) => {
    if (!field) {
      setGroupBy(null);
      return;
    }
    
    setGroupBy({ field });
  };
  
  return (
    <div className={cn("bg-white rounded-lg shadow p-3 mb-4", className)}>
      {/* Search */}
      <div className="flex items-center mb-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
            </button>
          )}
        </div>
      </div>
      
      {/* Quick filters - Buttons for common filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => applyQuickFilter('high-priority')}
          className={cn(
            "inline-flex items-center px-3 py-1 text-sm rounded-full",
            isQuickFilterActive('high-priority')
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
          )}
        >
          <Flag className="h-3 w-3 mr-1" />
          High Priority
        </button>
        <button
          onClick={() => applyQuickFilter('due-today')}
          className={cn(
            "inline-flex items-center px-3 py-1 text-sm rounded-full",
            isQuickFilterActive('due-today')
              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
          )}
        >
          <Calendar className="h-3 w-3 mr-1" />
          Due Today
        </button>
        <button
          onClick={() => applyQuickFilter('overdue')}
          className={cn(
            "inline-flex items-center px-3 py-1 text-sm rounded-full",
            isQuickFilterActive('overdue')
              ? "bg-orange-100 text-orange-800 border border-orange-300"
              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
          )}
        >
          <Clock className="h-3 w-3 mr-1" />
          Overdue
        </button>
        <button
          onClick={() => applyQuickFilter('work')}
          className={cn(
            "inline-flex items-center px-3 py-1 text-sm rounded-full",
            isQuickFilterActive('work')
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
          )}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Work
        </button>
        <button
          onClick={() => applyQuickFilter('personal')}
          className={cn(
            "inline-flex items-center px-3 py-1 text-sm rounded-full",
            isQuickFilterActive('personal')
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
          )}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Personal
        </button>
      </div>
      
      {/* Sort and Group Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortCriteria.field}
              onChange={(e) => changeSortField(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-1 pl-3 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="due_date">Due Date</option>
              <option value="last_active">Last Active</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="category_name">Category</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          {/* Sort Direction Button */}
          <button
            onClick={toggleSortOrder}
            className="p-1 rounded-md border border-gray-300 hover:bg-gray-100"
            title={sortCriteria.direction === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortCriteria.direction === 'asc' ? (
              <SortAsc className="h-4 w-4 text-gray-600" />
            ) : (
              <SortDesc className="h-4 w-4 text-gray-600" />
            )}
          </button>
          
          {/* Group By Dropdown */}
          <div className="relative">
            <select
              value={groupBy?.field || ''}
              onChange={(e) => handleGroupByChange(e.target.value || null)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-1 pl-3 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No Grouping</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="category_name">Category</option>
              <option value="due_date">Due Date</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <Layers className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        
        {/* Filter actions */}
        <div className="flex items-center gap-2">
          {filters.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
          >
            <Filter className="h-4 w-4 mr-1" />
            {isExpanded ? 'Less Filters' : 'More Filters'}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>
        </div>
      </div>
      
      {/* Task count */}
      {showTaskCount && (
        <div className="mt-2 text-xs text-gray-500">
          Showing {filteredCount} of {taskCount} tasks
        </div>
      )}
      
      {/* Advanced filters (expandable) */}
      {isExpanded && (
        <div className="mt-4 p-4 border-t border-gray-200">
          <div className="font-medium mb-3">Advanced Filters</div>
          
          {/* This would be expanded with more complex filters based on the app requirements */}
          <div className="space-y-4">
            {/* Status filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex flex-wrap gap-2">
                {['not_started', 'in_progress', 'blocked', 'completed', 'cancelled'].map(status => {
                  const isActive = filters.some(f => 
                    f.field === 'status' && f.operator === 'in' && 
                    Array.isArray(f.value) && f.value.includes(status)
                  );
                  
                  return (
                    <button
                      key={status}
                      onClick={() => applyQuickFilter(`status:${status}`)}
                      className={cn(
                        "inline-flex items-center px-3 py-1 text-sm rounded-md",
                        isActive
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                      )}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Priority filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <div className="flex flex-wrap gap-2">
                {['low', 'medium', 'high'].map(priority => {
                  const isActive = filters.some(f => 
                    f.field === 'priority' && f.operator === 'in' && 
                    Array.isArray(f.value) && f.value.includes(priority)
                  );
                  
                  return (
                    <button
                      key={priority}
                      onClick={() => applyQuickFilter(`priority:${priority}`)}
                      className={cn(
                        "inline-flex items-center px-3 py-1 text-sm rounded-md",
                        isActive
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                      )}
                    >
                      {priority}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
