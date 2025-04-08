import { useCategories } from '../../contexts/CategoryCompat';
import { useSettings } from '../../contexts/SettingsCompat';
import { Eye, EyeOff, ArrowRight, Settings } from 'lucide-react';
import Switch from '../UI/Switch';

/**
 * Admin component for managing z_ prefixed legacy categories
 */
export function AdminCategoryManager() {
  const { categories } = useCategories();
  const { settings, updateSetting } = useSettings();
  const { hiddenCategories } = settings;
  
  // Filter for legacy categories (z_ prefixed)
  const legacyCategories = categories.filter(cat => cat.name.startsWith('z_'));
  
  // Toggle visibility for a legacy category
  const toggleCategoryVisibility = (categoryId: string) => {
    const isHidden = hiddenCategories.includes(categoryId);
    const newHiddenCategories = isHidden
      ? hiddenCategories.filter(id => id !== categoryId)
      : [...hiddenCategories, categoryId];
      
    updateSetting('hiddenCategories', newHiddenCategories);
  };
  
  // Show all legacy categories
  const showAllLegacyCategories = () => {
    const legacyCatIds = legacyCategories.map(cat => cat.id);
    const newHiddenCategories = hiddenCategories.filter(
      id => !legacyCatIds.includes(id)
    );
    updateSetting('hiddenCategories', newHiddenCategories);
  };
  
  // Hide all legacy categories
  const hideAllLegacyCategories = () => {
    const legacyCatIds = legacyCategories.map(cat => cat.id);
    const newHiddenCategories = [...new Set([...hiddenCategories, ...legacyCatIds])];
    updateSetting('hiddenCategories', newHiddenCategories);
  };

  if (legacyCategories.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Legacy Categories</h2>
        <p className="text-gray-500">No legacy categories found.</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Legacy Categories</h2>
        <div className="flex space-x-2">
          <button
            onClick={showAllLegacyCategories}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-green-50 text-green-700 hover:bg-green-100"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Show All
          </button>
          <button
            onClick={hideAllLegacyCategories}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            <EyeOff className="w-3.5 h-3.5 mr-1" />
            Hide All
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        These are legacy categories that have been renamed with the "z_" prefix. You can manage their visibility here.
      </p>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 bg-gray-100 px-4 py-2 border-b">
          <div className="col-span-6 font-medium text-sm text-gray-600">Category</div>
          <div className="col-span-3 font-medium text-sm text-gray-600">Original Name</div>
          <div className="col-span-3 font-medium text-sm text-gray-600">Visibility</div>
        </div>
        
        {legacyCategories.map((category) => {
          const isVisible = !hiddenCategories.includes(category.id);
          const originalName = category.name.substring(2); // Remove "z_" prefix
          
          return (
            <div key={category.id} className="grid grid-cols-12 px-4 py-3 border-b items-center">
              {/* Category Name with Color */}
              <div className="col-span-6 flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: category.color || '#9CA3AF' }}
                />
                <span>{category.name}</span>
              </div>
              
              {/* Original Name */}
              <div className="col-span-3 flex items-center text-gray-600">
                <ArrowRight className="w-3.5 h-3.5 mr-1 text-gray-400" />
                <span>{originalName}</span>
              </div>
              
              {/* Visibility Toggle */}
              <div className="col-span-3">
                <div className="flex items-center">
                  <Switch 
                    checked={isVisible}
                    onChange={() => toggleCategoryVisibility(category.id)}
                    hideLabel
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {isVisible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        <div className="flex items-center mb-1">
          <Settings className="w-4 h-4 mr-1.5" />
          <span className="font-medium">Admin Note</span>
        </div>
        <p>
          These categories were automatically renamed when the app was upgraded to use the new recommended
          categories (Personal, Family, Work). The "z_" prefix ensures they don't conflict with the new categories.
        </p>
      </div>
    </div>
  );
}

export default AdminCategoryManager;
