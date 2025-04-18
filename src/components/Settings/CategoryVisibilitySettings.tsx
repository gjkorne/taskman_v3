import { useCategories } from '../../contexts/category';
import { useSettings } from '../../contexts/SettingsCompat';
import { Icon } from '../UI/Icon';

export function CategoryVisibilitySettings() {
  const { categories, defaultCategories } = useCategories();
  const { settings, updateSetting } = useSettings();
  const { hiddenCategories, hideDefaultCategories } = settings;

  // Toggle hiding a specific category
  const toggleCategoryVisibility = (categoryId: string) => {
    const newHiddenCategories = hiddenCategories.includes(categoryId)
      ? hiddenCategories.filter(id => id !== categoryId)
      : [...hiddenCategories, categoryId];
    
    updateSetting('hiddenCategories', newHiddenCategories);
  };

  // Toggle hiding all default categories
  const toggleDefaultCategoriesVisibility = () => {
    updateSetting('hideDefaultCategories', !hideDefaultCategories);
  };

  // Custom categories are those that are not default
  const customCategories = categories.filter(category => !category.is_default);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Category Visibility</h3>
        <p className="text-sm text-gray-600 mb-4">
          Hide categories you don't use to keep your task interface clean and focused.
        </p>
      </div>

      {/* Default Categories Toggle */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Default Categories</h4>
            <p className="text-sm text-gray-500">Show or hide all default categories</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={!hideDefaultCategories}
              onChange={toggleDefaultCategoriesVisibility}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-100 dark:bg-gray-600 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            <span className="sr-only">Show default categories</span>
          </label>
        </div>
      </div>

      {/* Default Categories List (only shown if not all hidden) */}
      {!hideDefaultCategories && defaultCategories.length > 0 && (
        <div className="pb-4 border-b border-gray-200">
          <h4 className="font-medium mb-2">Default Category Settings</h4>
          <ul className="space-y-2">
            {defaultCategories.map(category => (
              <li key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  <span>{category.name}</span>
                </div>
                <button
                  onClick={() => toggleCategoryVisibility(category.id)}
                  className={`p-1 rounded ${
                    hiddenCategories.includes(category.id) 
                      ? 'text-gray-500 hover:text-blue-600' 
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                  title={hiddenCategories.includes(category.id) ? 'Show category' : 'Hide category'}
                >
                  {hiddenCategories.includes(category.id) ? <Icon name="Eye" size={18} /> : <Icon name="EyeOff" size={18} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Custom Categories List */}
      {customCategories.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Custom Category Settings</h4>
          <ul className="space-y-2">
            {customCategories.map(category => (
              <li key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  <span>{category.name}</span>
                </div>
                <button
                  onClick={() => toggleCategoryVisibility(category.id)}
                  className={`p-1 rounded ${
                    hiddenCategories.includes(category.id) 
                      ? 'text-gray-500 hover:text-blue-600' 
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                  title={hiddenCategories.includes(category.id) ? 'Show category' : 'Hide category'}
                >
                  {hiddenCategories.includes(category.id) ? <Icon name="Eye" size={18} /> : <Icon name="EyeOff" size={18} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {categories.length === 0 && (
        <p className="text-sm text-gray-500 italic">No categories found. Create categories to manage their visibility.</p>
      )}
    </div>
  );
}
