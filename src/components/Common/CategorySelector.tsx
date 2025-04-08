import React from 'react';
import { InfoIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCategories } from '../../contexts/CategoryCompat';
import { useSettings } from '../../contexts/SettingsCompat';
import { CATEGORIES } from '../../types/categories';
import { Tooltip } from '../UI/Tooltip';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCustomCategorySelect?: (id: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  visibleCategories?: string[]; 
}

// Valid category keys for type safety
type CategoryKey = keyof typeof CATEGORIES;

/**
 * CategorySelector component
 * Provides a consistent UI for selecting task categories across the application
 */
export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  onCustomCategorySelect,
  disabled = false,
  error,
  className = '',
  visibleCategories
}) => {
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { hiddenCategories, hideDefaultCategories } = settings;

  // Get the built-in category keys
  const builtInCategoryKeys = Object.keys(CATEGORIES) as Array<CategoryKey>;
  
  // Filter out hidden default categories if setting is enabled
  let visibleBuiltInCategoryKeys = hideDefaultCategories
    ? []
    : builtInCategoryKeys;
    
  // Filter based on visibleCategories prop if provided
  if (visibleCategories && visibleCategories.length > 0) {
    visibleBuiltInCategoryKeys = visibleBuiltInCategoryKeys.filter(
      cat => visibleCategories.includes(cat)
    );
  }
    
  // Filter out individually hidden categories
  let visibleCustomCategories = categories.filter(
    cat => !hiddenCategories.includes(cat.id)
  );
  
  // Further filter custom categories based on visibleCategories prop if provided
  if (visibleCategories && visibleCategories.length > 0) {
    visibleCustomCategories = visibleCustomCategories.filter(
      cat => visibleCategories.includes(cat.name.toLowerCase())
    );
  }

  // Handle direct category selection
  const handleCategorySelect = (categoryValue: string) => {
    onChange(categoryValue);
  };

  // Handle custom category selection
  const handleCustomCategorySelect = (categoryId: string, categoryName: string) => {
    onChange(categoryName.toLowerCase());
    if (onCustomCategorySelect) {
      onCustomCategorySelect(categoryId);
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-500">Select a category</div>
        <Tooltip content="Category visibility can be customized in Settings" position="left">
          <InfoIcon className="w-4 h-4 text-gray-400 cursor-help" />
        </Tooltip>
      </div>
      
      {/* Category buttons in a flex grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {/* Built-in category buttons */}
        {visibleBuiltInCategoryKeys.map((categoryKey) => {
          const isSelected = value === categoryKey;
          const displayName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
          
          return (
            <button 
              key={categoryKey}
              type="button"
              onClick={() => handleCategorySelect(categoryKey)}
              disabled={disabled}
              className={cn(
                "flex items-center p-2 rounded-md border cursor-pointer transition-all justify-center",
                isSelected 
                  ? `bg-white border-2 ${getCategoryBorderClass(categoryKey)} font-medium` 
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span 
                className={cn(
                  "w-3 h-3 rounded-full mr-2",
                  getCategoryDotColor(categoryKey)
                )}
              />
              <span>{displayName}</span>
            </button>
          );
        })}
        
        {/* Custom category buttons */}
        {visibleCustomCategories.map((category) => {
          const isSelected = value === category.name.toLowerCase();
          
          return (
            <button 
              key={category.id}
              type="button"
              onClick={() => handleCustomCategorySelect(category.id, category.name)}
              disabled={disabled}
              className={cn(
                "flex items-center p-2 rounded-md border cursor-pointer transition-all justify-center",
                isSelected 
                  ? "bg-white border-2 border-blue-500 font-medium" 
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {category.color ? (
                <span 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: category.color }}
                />
              ) : (
                <span className="w-3 h-3 rounded-full mr-2 bg-gray-400" />
              )}
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Helper function to get consistent color for categories
function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'childcare':
      return 'cyan';
    case 'work':
      return 'green';
    case 'personal':
      return 'blue';
    case 'other':
      return 'gray';
    default:
      return 'gray';
  }
}

// Helper function to get bold border classes for selected categories
function getCategoryBorderClass(category: string): string {
  const categoryColor = getCategoryColor(category);
  
  switch (categoryColor) {
    case 'cyan':
      return 'border-cyan-500 text-gray-900';
    case 'green':
      return 'border-green-500 text-gray-900';
    case 'blue':
      return 'border-blue-500 text-gray-900';
    case 'purple':
      return 'border-purple-500 text-gray-900';
    case 'gray':
    default:
      return 'border-gray-500 text-gray-900';
  }
}

// Helper function to get background color for category dots
function getCategoryDotColor(category: string): string {
  const categoryColor = getCategoryColor(category);
  
  switch (categoryColor) {
    case 'cyan':
      return 'bg-cyan-500';
    case 'green':
      return 'bg-green-500';
    case 'blue':
      return 'bg-blue-500';
    case 'purple':
      return 'bg-purple-500';
    case 'gray':
    default:
      return 'bg-gray-500';
  }
}

export default CategorySelector;
