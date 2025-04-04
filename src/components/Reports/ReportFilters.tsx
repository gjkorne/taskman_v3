import { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { ReportFilter } from '../../services/api/reportsService';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface ReportFiltersProps {
  filters: ReportFilter;
  onFiltersChange: (filters: ReportFilter) => void;
  categories?: string[];
}

export function ReportFilters({ filters, onFiltersChange, categories = [] }: ReportFiltersProps) {
  // Date range presets
  const applyDateRange = (range: 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'last30Days' | 'custom') => {
    const now = new Date();
    let startDate, endDate;
    
    switch (range) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case 'thisWeek':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'last30Days':
      default:
        startDate = subDays(now, 30);
        endDate = now;
        break;
    }
    
    onFiltersChange({
      ...filters,
      startDate,
      endDate
    });
  };
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(filters.categoryNames || []);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  // Update filters when categories change
  useEffect(() => {
    onFiltersChange({
      ...filters,
      categoryNames: selectedCategories.length > 0 ? selectedCategories : undefined
    });
  }, [selectedCategories]);
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Date Range */}
        <div className="w-full lg:w-auto space-y-2">
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => applyDateRange('today')}
              className={`px-3 py-1 text-sm rounded-md ${
                filters.startDate.toDateString() === new Date().toDateString() && filters.startDate.getHours() === 0
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'border text-gray-700 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => applyDateRange('thisWeek')}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
            >
              This Week
            </button>
            <button 
              onClick={() => applyDateRange('thisMonth')}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
            >
              This Month
            </button>
            <button 
              onClick={() => applyDateRange('last30Days')}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
            >
              Last 30 Days
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="date"
                value={format(filters.startDate, 'yyyy-MM-dd')}
                onChange={(e) => onFiltersChange({...filters, startDate: new Date(e.target.value)})}
                className="pl-10 pr-3 py-2 border rounded text-sm w-full"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="date"
                value={format(filters.endDate, 'yyyy-MM-dd')}
                onChange={(e) => onFiltersChange({...filters, endDate: new Date(e.target.value)})}
                className="pl-10 pr-3 py-2 border rounded text-sm w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Group By */}
        <div className="w-full lg:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
          <select
            value={filters.groupBy}
            onChange={(e) => onFiltersChange({...filters, groupBy: e.target.value as any})}
            className="w-full border rounded-md p-2 text-sm"
          >
            <option value="task">Task</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="category">Category</option>
          </select>
        </div>
        
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="w-full lg:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <div className="relative">
              <button 
                className="w-full flex items-center justify-between border rounded-md p-2 bg-white text-sm"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              >
                <span>
                  {selectedCategories.length === 0 
                    ? 'All Categories' 
                    : selectedCategories.length === 1 
                      ? selectedCategories[0]
                      : `${selectedCategories.length} categories`}
                </span>
                <ChevronDown size={16} />
              </button>
              
              {categoryDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="p-2">
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.length === 0}
                        onChange={() => setSelectedCategories([])}
                        className="mr-2"
                      />
                      <span>All Categories</span>
                    </label>
                    
                    {categories.map(category => (
                      <label key={category} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="mr-2"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
