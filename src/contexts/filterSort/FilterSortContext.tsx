import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../lib/auth';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { FilterCriteria, GroupCriteria, SortCriteria } from '../../services/interfaces/IFilterSortService';
import { TaskFilter, defaultFilters } from '../../components/TaskList/FilterPanel';

// Convert between the old TaskFilter type and the new FilterCriteria[] for backward compatibility
const convertLegacyFilters = (filters: TaskFilter): FilterCriteria[] => {
  const result: FilterCriteria[] = [];

  // Convert status filters
  if (filters.status && filters.status.length > 0) {
    result.push({
      field: 'status',
      operator: 'in',
      value: filters.status
    });
  }

  // Convert priority filters
  if (filters.priority && filters.priority.length > 0) {
    result.push({
      field: 'priority',
      operator: 'in',
      value: filters.priority
    });
  }

  // Convert category filters
  if (filters.category && filters.category.length > 0) {
    result.push({
      field: 'category_name',
      operator: 'in',
      value: filters.category
    });
  }

  // Convert due date filters
  if (filters.dueDate && filters.dueDate.length > 0) {
    result.push({
      field: 'due_date',
      operator: 'in',
      value: filters.dueDate
    });
  }

  // Convert showCompleted
  if (!filters.showCompleted) {
    result.push({
      field: 'status',
      operator: 'neq',
      value: 'completed'
    });
  }

  return result;
};

// Convert the FilterCriteria[] to the old TaskFilter type for backward compatibility
const convertToLegacyFilters = (criteria: FilterCriteria[]): TaskFilter => {
  const result = { ...defaultFilters };

  // Extract values for each field
  for (const filter of criteria) {
    if (filter.field === 'status' && filter.operator === 'in' && Array.isArray(filter.value)) {
      result.status = filter.value;
    } else if (filter.field === 'status' && filter.operator === 'neq' && filter.value === 'completed') {
      result.showCompleted = false;
    } else if (filter.field === 'priority' && filter.operator === 'in' && Array.isArray(filter.value)) {
      result.priority = filter.value;
    } else if (filter.field === 'category_name' && filter.operator === 'in' && Array.isArray(filter.value)) {
      result.category = filter.value;
    } else if (filter.field === 'due_date' && filter.operator === 'in' && Array.isArray(filter.value)) {
      result.dueDate = filter.value;
    }
  }

  return result;
};

// New type for filter presets
export type FilterPreset = {
  id: string;
  name: string;
  filters: FilterCriteria[];
  isDefault?: boolean;
  isSystem?: boolean;
};

// Define the context type
interface FilterSortContextType {
  // Filter state
  filters: FilterCriteria[];
  setFilters: (filters: FilterCriteria[]) => void;
  clearFilters: () => void;
  
  // Sort state
  sortCriteria: SortCriteria;
  setSortCriteria: (criteria: SortCriteria) => void;
  
  // Group state
  groupBy: GroupCriteria | null;
  setGroupBy: (criteria: GroupCriteria | null) => void;
  
  // Presets
  filterPresets: FilterPreset[];
  addFilterPreset: (preset: Omit<FilterPreset, 'id'>) => void;
  removeFilterPreset: (id: string) => void;
  applyFilterPreset: (id: string) => void;
  
  // Legacy support
  legacyFilters: TaskFilter;
  setLegacyFilters: (filters: TaskFilter) => void;
  
  // Search query
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Combined actions
  applyQuickFilter: (filterName: string) => void;
}

// Create context with default values
export const FilterSortContext = createContext<FilterSortContextType | undefined>(undefined);

// Context provider component
export const FilterSortProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get the current user for saving user preferences
  const { user } = useAuth();
  
  // Get the filter service
  const filterSortService = ServiceRegistry.getFilterSortService();
  
  // State for filters, sorting, and grouping
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>({ 
    field: 'created_at', 
    direction: 'desc' 
  });
  const [groupBy, setGroupBy] = useState<GroupCriteria | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter presets (system + user)
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([
    {
      id: 'all',
      name: 'All Tasks',
      filters: [],
      isDefault: true,
      isSystem: true
    },
    {
      id: 'work',
      name: 'Work Tasks',
      filters: filterSortService.createPresetFilter('work'),
      isSystem: true
    },
    {
      id: 'personal',
      name: 'Personal Tasks',
      filters: filterSortService.createPresetFilter('personal'),
      isSystem: true
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      filters: filterSortService.createPresetFilter('high-priority'),
      isSystem: true
    },
    {
      id: 'due-today',
      name: 'Due Today',
      filters: filterSortService.createPresetFilter('due-today'),
      isSystem: true
    },
    {
      id: 'overdue',
      name: 'Overdue',
      filters: filterSortService.createPresetFilter('overdue'),
      isSystem: true
    }
  ]);
  
  // Legacy filters state for backward compatibility
  const [legacyFilters, setLegacyFilters] = useState<TaskFilter>(defaultFilters);
  
  // Load user's saved filters on mount
  useEffect(() => {
    const loadUserFilters = async () => {
      if (user) {
        try {
          const savedFilters = await filterSortService.getUserFilters(user.id);
          if (savedFilters && savedFilters.length > 0) {
            setFilters(savedFilters);
            setLegacyFilters(convertToLegacyFilters(savedFilters));
          }
        } catch (error) {
          console.error('Error loading user filters:', error);
        }
      }
    };
    
    loadUserFilters();
  }, [user]);
  
  // Sync between legacy filters and new filters
  useEffect(() => {
    setLegacyFilters(convertToLegacyFilters(filters));
  }, [filters]);
  
  // Clear all filters
  const clearFilters = () => {
    setFilters([]);
    setLegacyFilters(defaultFilters);
  };
  
  // Save filters when they change significantly
  useEffect(() => {
    const saveUserFilters = async () => {
      if (user && filters.length > 0) {
        try {
          await filterSortService.saveUserFilters(user.id, filters);
        } catch (error) {
          console.error('Error saving user filters:', error);
        }
      }
    };
    
    // Debounce to avoid too many saves
    const timeoutId = setTimeout(saveUserFilters, 1000);
    return () => clearTimeout(timeoutId);
  }, [filters, user]);
  
  // Add a new filter preset
  const addFilterPreset = (preset: Omit<FilterPreset, 'id'>) => {
    const newPreset: FilterPreset = {
      ...preset,
      id: `user-preset-${Date.now()}`
    };
    
    setFilterPresets(prev => [...prev, newPreset]);
  };
  
  // Remove a filter preset
  const removeFilterPreset = (id: string) => {
    setFilterPresets(prev => prev.filter(preset => 
      preset.id !== id || preset.isSystem // Don't allow removing system presets
    ));
  };
  
  // Apply a filter preset
  const applyFilterPreset = (id: string) => {
    const preset = filterPresets.find(p => p.id === id);
    if (preset) {
      setFilters(preset.filters);
    }
  };
  
  // Apply a quick filter (shorthand for common filters)
  const applyQuickFilter = (filterName: string) => {
    const newFilters = filterSortService.createPresetFilter(filterName);
    setFilters(prevFilters => {
      // Check if this filter is already applied
      const isAlreadyApplied = prevFilters.some(f => 
        JSON.stringify(f) === JSON.stringify(newFilters[0])
      );
      
      if (isAlreadyApplied) {
        // If already applied, remove it (toggle behavior)
        return prevFilters.filter(f => 
          JSON.stringify(f) !== JSON.stringify(newFilters[0])
        );
      } else {
        // Otherwise, add it
        return [...prevFilters, ...newFilters];
      }
    });
  };
  
  // Handle setting legacy filters (for backward compatibility)
  const handleSetLegacyFilters = (newLegacyFilters: TaskFilter) => {
    setLegacyFilters(newLegacyFilters);
    setFilters(convertLegacyFilters(newLegacyFilters));
  };
  
  const contextValue: FilterSortContextType = {
    filters,
    setFilters,
    clearFilters,
    sortCriteria,
    setSortCriteria,
    groupBy,
    setGroupBy,
    filterPresets,
    addFilterPreset,
    removeFilterPreset,
    applyFilterPreset,
    legacyFilters,
    setLegacyFilters: handleSetLegacyFilters,
    searchQuery,
    setSearchQuery,
    applyQuickFilter
  };
  
  return (
    <FilterSortContext.Provider value={contextValue}>
      {children}
    </FilterSortContext.Provider>
  );
};

// Custom hook to use the filter/sort context
export const useFilterSort = () => {
  const context = useContext(FilterSortContext);
  if (context === undefined) {
    throw new Error('useFilterSort must be used within a FilterSortProvider');
  }
  return context;
};
