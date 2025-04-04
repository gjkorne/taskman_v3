import { useState, useEffect } from 'react';
import { useCategories } from '../../contexts/CategoryCompat';
import { useSettings } from '../../contexts/SettingsCompat';
import Switch from '../UI/Switch';
import { Icon } from '../UI/Icon';

export function QuickTaskCategorySettings() {
  const { categories } = useCategories();
  const { settings, updateSetting } = useSettings();
  const { quickTaskCategories, defaultQuickTaskCategory } = settings;
  
  // State for all available categories
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // Populate available categories when component mounts
  useEffect(() => {
    const standardCategories = ['work', 'personal', 'childcare', 'other'];
    
    // Add any custom categories from the DB
    const customCategoryNames = categories
      .filter(cat => !cat.is_default)
      .map(cat => cat.name.toLowerCase());
    
    // Combine and remove duplicates
    const allCategories = [...new Set([...standardCategories, ...customCategoryNames])];
    setAvailableCategories(allCategories);
  }, [categories]);

  // Toggle a category in the quick task categories
  const toggleCategory = (category: string) => {
    const newQuickTaskCategories = quickTaskCategories.includes(category)
      ? quickTaskCategories.filter(cat => cat !== category)
      : [...quickTaskCategories, category];
    
    updateSetting('quickTaskCategories', newQuickTaskCategories);
    
    // If we're removing the default category, update the default
    if (category === defaultQuickTaskCategory && !newQuickTaskCategories.includes(category)) {
      updateSetting('defaultQuickTaskCategory', newQuickTaskCategories[0] || 'work');
    }
  };

  // Set a category as the default
  const setAsDefault = (category: string) => {
    // If the category isn't in quickTaskCategories, add it
    if (!quickTaskCategories.includes(category)) {
      updateSetting('quickTaskCategories', [...quickTaskCategories, category]);
    }
    
    // Set as default
    updateSetting('defaultQuickTaskCategory', category);
  };

  // Get color for a category
  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'work':
        return '#3B82F6'; // blue-500
      case 'personal':
        return '#8B5CF6'; // purple-500
      case 'childcare':
        return '#10B981'; // green-500
      case 'other':
        return '#F59E0B'; // amber-500
      default:
        // Try to find the category in the database
        const dbCategory = categories.find(
          cat => cat.name.toLowerCase() === category.toLowerCase()
        );
        return dbCategory?.color || '#6B7280'; // gray-500
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Quick Task Categories</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose which categories appear in the quick task entry panel and set your default category.
        </p>
      </div>

      <div className="border border-gray-200 rounded-md">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium">Available Categories</h4>
        </div>
        <ul className="divide-y divide-gray-200">
          {availableCategories.map(category => (
            <li key={category} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span 
                    className="inline-block w-4 h-4 rounded-full" 
                    style={{ backgroundColor: getCategoryColor(category) }}
                  ></span>
                  <span className="font-medium capitalize">{category}</span>
                  
                  {defaultQuickTaskCategory === category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                      Default
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Show in quick task entry */}
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Show</span>
                    <Switch 
                      checked={quickTaskCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                  </div>
                  
                  {/* Set as default button */}
                  {defaultQuickTaskCategory !== category && (
                    <button
                      onClick={() => setAsDefault(category)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                      disabled={!quickTaskCategories.includes(category)}
                    >
                      Set as default
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {quickTaskCategories.length === 0 && (
        <div className="py-3 px-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon name="AlertTriangle" className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need at least one category for quick task entry. 'Work' will be used as a fallback.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
