import { CategoryVisibilitySettings } from './CategoryVisibilitySettings';
import { QuickTaskCategorySettings } from './QuickTaskCategorySettings';
import { CategoryMappingSettings } from '../../components/Settings/CategoryMappingSettings';

export function CategorySettings() {
  return (
    <div className="p-4">
      {/* Category Management Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Category Management</h2>
        <p className="text-gray-600 mb-4">
          Create and manage your task categories here.
        </p>
      </div>

      {/* Category Mapping Section - ADDED DIRECTLY TO THE PAGE */}
      <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Map Categories</h2>
        <p className="text-gray-600 mb-4">
          Use this tool to move tasks from one category to another. This is
          useful for consolidating custom categories into standard ones.
        </p>
        <CategoryMappingSettings />
      </div>

      {/* Category Visibility Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Category Visibility</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <CategoryVisibilitySettings />
        </div>
      </div>

      {/* Quick Task Settings Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Task Settings</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <QuickTaskCategorySettings />
        </div>
      </div>
    </div>
  );
}
