import { useCategoryManager } from '../../hooks/useCategoryManager';
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsCompat';
import { Pencil, Trash2, Check, X, Eye, EyeOff, Settings } from 'lucide-react';
import Switch from '../UI/Switch';
import { Tooltip } from '../UI/Tooltip';
import { getUniqueColor } from '../../utils/categoryInitializer';
import ConfirmationDialog from '../UI/ConfirmationDialog';

// Predefined colors for categories
const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#A855F7', // Violet
  '#D946EF', // Fuchsia
  '#06B6D4'  // Cyan
];

export function CategorySettings() {
  const {
    categories,
    isLoading,
    error,
    createNewCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryManager();

  const { settings, updateSetting } = useSettings();
  const { hiddenCategories, quickTaskCategories, defaultQuickTaskCategory } = settings;

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedColor, setEditedColor] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // Deletion confirmation state
  const [deletionConfirmation, setDeletionConfirmation] = useState<{
    isOpen: boolean;
    categoryId: string;
    categoryName: string;
  }>({
    isOpen: false,
    categoryId: '',
    categoryName: ''
  });

  // Get random color for new category
  const getRandomColor = () => {
    return getUniqueColor(categories);
  };

  // Handler functions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    // Create new category with a random color
    try {
      // First create with name only
      await createNewCategory(newCategoryName);
      
      // Find the newly created category to update with color
      const newCategory = categories.find(cat => cat.name === newCategoryName);
      if (newCategory) {
        await updateCategory(newCategory.id, { color: getRandomColor() });
      }
      
      setNewCategoryName("");
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  const handleEditCategory = async (id: string) => {
    if (!editedName.trim()) return;
    
    await updateCategory(id, { 
      name: editedName,
      color: editedColor
    });
    
    setEditingCategory(null);
  };

  const startEditing = (category: any) => {
    setEditingCategory(category.id);
    setEditedName(category.name);
    setEditedColor(category.color || getRandomColor());
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  // Confirmation for category deletion
  const confirmDeleteCategory = (category: any) => {
    setDeletionConfirmation({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name
    });
  };

  const handleDeleteConfirmed = async () => {
    await deleteCategory(deletionConfirmation.categoryId);
    setDeletionConfirmation({
      isOpen: false,
      categoryId: '',
      categoryName: ''
    });
  };

  const handleCancelDelete = () => {
    setDeletionConfirmation({
      isOpen: false,
      categoryId: '',
      categoryName: ''
    });
  };

  // Toggle visibility of a category
  const toggleCategoryVisibility = (categoryId: string) => {
    const newHiddenCategories = hiddenCategories.includes(categoryId)
      ? hiddenCategories.filter(id => id !== categoryId)
      : [...hiddenCategories, categoryId];
    
    updateSetting('hiddenCategories', newHiddenCategories);
  };

  // Toggle if a category appears in quick task buttons
  const toggleQuickTaskCategory = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase();
    const newQuickTaskCategories = quickTaskCategories.includes(normalizedName)
      ? quickTaskCategories.filter(cat => cat !== normalizedName)
      : [...quickTaskCategories, normalizedName];
    
    updateSetting('quickTaskCategories', newQuickTaskCategories);
    
    // If we're removing the default category, update the default
    if (normalizedName === defaultQuickTaskCategory && !newQuickTaskCategories.includes(normalizedName)) {
      updateSetting('defaultQuickTaskCategory', newQuickTaskCategories[0] || 'work');
    }
  };

  // Set a category as the default quick task category
  const setAsDefaultQuickTask = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase();
    
    // If the category isn't in quickTaskCategories, add it
    if (!quickTaskCategories.includes(normalizedName)) {
      updateSetting('quickTaskCategories', [...quickTaskCategories, normalizedName]);
    }
    
    // Set as default
    updateSetting('defaultQuickTaskCategory', normalizedName);
  };

  if (isLoading) {
    return <div className="text-center p-6">Loading categories...</div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200 mb-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Category Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage all your task categories in one place. Add, edit, or remove categories, 
          adjust visibility, and set default preferences.
        </p>
      </div>

      {/* Add New Category */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <h4 className="font-medium mb-3">Add New Category</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Enter category name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategoryName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Category
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          A random color will be assigned to your new category, which you can change later.
        </p>
      </div>

      {/* Category List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 bg-gray-100 px-4 py-2 border-b">
          <div className="col-span-3 font-medium text-sm text-gray-600">Category</div>
          <div className="col-span-2 font-medium text-sm text-gray-600">Color</div>
          <div className="col-span-2 font-medium text-sm text-gray-600">Visibility</div>
          <div className="col-span-2 font-medium text-sm text-gray-600">Quick Task</div>
          <div className="col-span-3 font-medium text-sm text-gray-600">Actions</div>
        </div>
        
        {categories.map((category) => {
          const isEditing = editingCategory === category.id;
          const isVisible = !hiddenCategories.includes(category.id);
          const isDefault = category.is_default;
          const isQuickTask = quickTaskCategories.includes(category.name.toLowerCase());
          const isDefaultQuickTask = defaultQuickTaskCategory === category.name.toLowerCase();
          
          return (
            <div key={category.id} className="grid grid-cols-12 px-4 py-3 border-b items-center">
              {/* Category Name */}
              <div className="col-span-3">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                  />
                ) : (
                  <div className="flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color || '#9CA3AF' }}
                    />
                    <span className={isDefault ? "font-medium" : ""}>
                      {category.name}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Color Picker */}
              <div className="col-span-2">
                {isEditing ? (
                  <div className="flex gap-1 flex-wrap">
                    {CATEGORY_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setEditedColor(color)}
                        className={`w-6 h-6 rounded-full ${editedColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                ) : (
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: category.color || '#9CA3AF' }}
                  />
                )}
              </div>
              
              {/* Visibility Toggle */}
              <div className="col-span-2">
                <Tooltip content={isVisible ? "Hide this category" : "Show this category"}>
                  <button 
                    onClick={() => toggleCategoryVisibility(category.id)}
                    className="p-1 rounded-full hover:bg-gray-100"
                    disabled={isDefault} // Can't hide default category
                  >
                    {isVisible ? (
                      <Eye className="w-5 h-5 text-green-600" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </Tooltip>
              </div>
              
              {/* Quick Task Toggle */}
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={isQuickTask}
                    onChange={() => toggleQuickTaskCategory(category.name)}
                    hideLabel
                  />
                  {isQuickTask && !isDefaultQuickTask && (
                    <button
                      onClick={() => setAsDefaultQuickTask(category.name)}
                      className="text-gray-400 hover:text-yellow-500"
                      title="Set as default quick task category"
                    >
                      <span className="w-4 h-4 text-gray-400 hover:text-yellow-500">★</span>
                    </button>
                  )}
                  {isDefaultQuickTask && (
                    <span className="w-4 h-4 text-yellow-500">★</span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="col-span-3 flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleEditCategory(category.id)}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(category)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Edit category"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    {!isDefault && (
                      <button
                        onClick={() => confirmDeleteCategory(category)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete category"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Category Tips
        </h4>
        <ul className="text-sm text-blue-700 space-y-1 ml-5 list-disc">
          <li>The default category cannot be hidden or deleted</li>
          <li>Quick Task categories appear as buttons when creating new tasks</li>
          <li>You can change the color of any category by editing it</li>
          <li>Hidden categories will still appear in your category settings but not in task forms</li>
        </ul>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deletionConfirmation.isOpen}
        title="Delete Category"
        message={`Are you sure you want to delete the "${deletionConfirmation.categoryName}" category? This action cannot be undone and all tasks associated with this category will be set to the default category.`}
        confirmButtonText="Delete"
        confirmButtonColor="red"
        onConfirm={handleDeleteConfirmed}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
