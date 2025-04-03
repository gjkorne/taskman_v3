import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCategories } from '../../contexts/CategoryContext';
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

  // Handle category selection
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
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
    }
  };

  // Determine if the current value is a custom category
  const selectedCategory = categories.find(
    cat => cat.name.toLowerCase() === value?.toLowerCase()
  );
  
  // Format the value for the select element
  const selectValue = selectedCategory 
    ? `custom:${selectedCategory.id}` 
    : value || '';

  // Get the built-in category keys
  const builtInCategoryKeys = Object.keys(CATEGORIES) as Array<CategoryKey>;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={selectValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 border rounded-md appearance-none pr-10",
            error ? "border-red-500" : "border-gray-300",
            disabled ? "bg-gray-100 cursor-not-allowed" : "focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          )}
          aria-invalid={error ? "true" : "false"}
        >
          <option value="">-- Select Category {required ? '' : '(Optional)'} --</option>
          
          {/* Built-in categories */}
          <optgroup label="Default Categories">
            {builtInCategoryKeys.map((categoryKey) => (
              <option key={categoryKey} value={categoryKey}>
                {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
              </option>
            ))}
          </optgroup>
          
          {/* User-defined categories */}
          {categories.length > 0 && (
            <optgroup label="My Categories">
              {categories.map(cat => (
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
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CategorySelector;
