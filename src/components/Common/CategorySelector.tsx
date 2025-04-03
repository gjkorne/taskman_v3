import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCategories } from '../../contexts/CategoryContext';
import { useSettings } from '../../contexts/SettingsContext';
import { CATEGORIES } from '../../types/categories';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCustomCategorySelect?: (id: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
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
  required = false,
  className = ''
}) => {
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { hiddenCategories, hideDefaultCategories } = settings;
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualDropdownControl, setManualDropdownControl] = useState(false);

  // Get the built-in category keys
  const builtInCategoryKeys = Object.keys(CATEGORIES) as Array<CategoryKey>;
  
  // Filter out hidden default categories if setting is enabled
  const visibleBuiltInCategoryKeys = hideDefaultCategories
    ? []
    : builtInCategoryKeys;
    
  // Filter out individually hidden categories
  const visibleCustomCategories = categories.filter(
    cat => !hiddenCategories.includes(cat.id)
  );

  // Get the main categories for radio buttons (limited to first 3)
  const mainCategories = visibleBuiltInCategoryKeys.slice(0, 3);
  
  // Determine if "more" options are available
  const hasMoreOptions = visibleBuiltInCategoryKeys.length > 3 || visibleCustomCategories.length > 0;

  // Determine if the current value is a custom category
  const selectedCategory = categories.find(
    cat => cat.name.toLowerCase() === value?.toLowerCase()
  );
  
  // Format the value for the select element
  const selectValue = selectedCategory 
    ? `custom:${selectedCategory.id}` 
    : value || '';

  // Handle direct category selection (radio buttons)
  const handleRadioChange = (categoryValue: string) => {
    onChange(categoryValue);
    // Always hide dropdown when a main category is selected
    setShowDropdown(false);
    setManualDropdownControl(false);
  };

  // Handle category selection from dropdown
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === "more") {
      // "More options..." was selected but no action needed
      return;
    }
    
    // Check if this is a custom category selection
    if (selectedValue.startsWith('custom:')) {
      const categoryId = selectedValue.replace('custom:', '');
      
      // Find the category to get its name
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        onChange(category.name.toLowerCase());
        if (onCustomCategorySelect) {
          onCustomCategorySelect(categoryId);
        }
      }
    } else {
      onChange(selectedValue);
      // If a main category was selected from dropdown, hide the dropdown
      if (mainCategories.includes(selectedValue as CategoryKey)) {
        setShowDropdown(false);
        setManualDropdownControl(false);
      }
    }
  };

  // Handle clicking the More button
  const handleMoreClick = () => {
    setShowDropdown(true);
    setManualDropdownControl(true);
  };

  // Set initial dropdown visibility
  useEffect(() => {
    // Only run this effect if we're not in manual control mode
    if (!manualDropdownControl) {
      // Only show dropdown for non-main categories or custom categories
      if (value && !mainCategories.includes(value as CategoryKey) && value !== '') {
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }
  }, [value, mainCategories, manualDropdownControl]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Radio button options for main categories */}
      <div className="flex flex-row gap-3 mb-3">
        {mainCategories.map((categoryKey) => {
          const isSelected = value === categoryKey;
          const displayName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
          
          return (
            <label 
              key={categoryKey}
              className={cn(
                "flex items-center p-2 rounded-md border cursor-pointer transition-all justify-center flex-1",
                isSelected 
                  ? `bg-white border-2 ${getCategoryBorderClass(categoryKey)} font-medium` 
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                type="radio"
                name="category"
                value={categoryKey}
                checked={isSelected}
                onChange={() => handleRadioChange(categoryKey)}
                disabled={disabled}
                className="sr-only" // Hide the actual radio input
              />
              <span 
                className={cn(
                  "w-3 h-3 rounded-full mr-2",
                  getCategoryDotColor(categoryKey)
                )}
              />
              <span>{displayName}</span>
            </label>
          );
        })}
        
        {/* "More options" radio button that shows the dropdown */}
        {hasMoreOptions && (
          <button 
            type="button"
            onClick={handleMoreClick}
            disabled={disabled}
            className={cn(
              "flex items-center p-2 rounded-md border cursor-pointer transition-all flex-1 justify-center",
              (showDropdown && !mainCategories.includes(value as CategoryKey)) 
                ? "bg-white border-2 border-blue-500 text-gray-900" 
                : "border-gray-300 text-gray-900 bg-white hover:bg-gray-50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
            <span>More...</span>
          </button>
        )}
      </div>
      
      {/* Dropdown for additional categories */}
      {showDropdown && (
        <div className="relative mt-2">
          <select
            value={selectValue || "more"}
            onChange={handleDropdownChange}
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 border rounded-md appearance-none pr-10",
              error ? "border-red-500" : "border-gray-300",
              disabled ? "bg-gray-100 cursor-not-allowed" : "focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            )}
            aria-invalid={error ? "true" : "false"}
          >
            <option value="more">-- Select Category --</option>
            
            {/* All built-in categories */}
            {visibleBuiltInCategoryKeys.length > 0 && (
              <optgroup label="Default Categories">
                {visibleBuiltInCategoryKeys.map((categoryKey) => (
                  <option key={categoryKey} value={categoryKey}>
                    {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
                  </option>
                ))}
              </optgroup>
            )}
            
            {/* User-defined categories */}
            {visibleCustomCategories.length > 0 && (
              <optgroup label="My Categories">
                {visibleCustomCategories.map(cat => (
                  <option key={cat.id} value={`custom:${cat.id}`}>
                    {cat.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          
          {/* Dropdown indicator */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      )}
      
      {/* Error message */}
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
