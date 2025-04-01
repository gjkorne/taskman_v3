import React, { useState } from 'react';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import { Category } from '../../services/api/categoryService';
import { X, Plus, Check, Pencil, Trash2, Star } from 'lucide-react';

export function CategorySettings() {
  const {
    categories,
    isLoading,
    error,
    createNewCategory,
    updateCategory,
    deleteCategory,
    makeSelectedCategoryDefault,
    getSelectedCategory,
    addSubcategory,
    removeSubcategory,
    renameSubcategory,
    setActiveCategory,
    selectedCategoryId
  } = useCategoryManager();

  // Local state for forms
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [editingSubcategoryName, setEditingSubcategoryName] = useState<string | null>(null);
  const [editedSubcategoryName, setEditedSubcategoryName] = useState('');

  // Get the currently selected category
  const selectedCategory = getSelectedCategory();

  // Form submission handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    await createNewCategory(newCategoryName);
    setNewCategoryName('');
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategoryName.trim() || !selectedCategoryId) return;
    
    await addSubcategory(newSubcategoryName);
    setNewSubcategoryName('');
  };

  const handleStartEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditedCategoryName(category.name);
  };

  const handleSaveEditCategory = async (categoryId: string) => {
    if (!editedCategoryName.trim()) return;
    
    await updateCategory(categoryId, { name: editedCategoryName });
    setEditingCategoryId(null);
  };

  const handleStartEditSubcategory = (subcategoryName: string) => {
    setEditingSubcategoryName(subcategoryName);
    setEditedSubcategoryName(subcategoryName);
  };

  const handleSaveEditSubcategory = async (oldName: string) => {
    if (!editedSubcategoryName.trim() || !selectedCategoryId) return;
    
    await renameSubcategory(oldName, editedSubcategoryName);
    setEditingSubcategoryName(null);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
  };

  const handleCancelEditSubcategory = () => {
    setEditingSubcategoryName(null);
  };

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleMakeDefault = async (categoryId: string) => {
    if (categoryId === selectedCategoryId) {
      await makeSelectedCategoryDefault();
    } else {
      setActiveCategory(categoryId);
      setTimeout(() => makeSelectedCategoryDefault(), 100);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-4">Loading categories...</div>;
  }

  if (error) {
    return <div className="text-red-500 mt-4">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* Left column - Categories */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Categories</h2>
        
        {/* Add new category form */}
        <form onSubmit={handleAddCategory} className="mb-4 flex">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="border rounded-l px-3 py-2 w-full"
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white px-3 py-2 rounded-r flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Add
          </button>
        </form>
        
        {/* Categories list */}
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-gray-500 italic">No categories yet. Create one to get started.</p>
          ) : (
            categories.map((category) => (
              <div 
                key={category.id}
                className={`border rounded p-3 ${selectedCategoryId === category.id ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-center">
                  {editingCategoryId === category.id ? (
                    <div className="flex items-center flex-grow">
                      <input
                        type="text"
                        value={editedCategoryName}
                        onChange={(e) => setEditedCategoryName(e.target.value)}
                        className="border rounded px-2 py-1 w-full mr-2"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveEditCategory(category.id)}
                        className="text-green-600 ml-1 p-1"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={handleCancelEditCategory}
                        className="text-red-600 ml-1 p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div 
                        className="flex-grow cursor-pointer"
                        onClick={() => handleSelectCategory(category.id)}
                      >
                        <span className="font-medium">{category.name}</span>
                        {category.is_default && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => handleStartEditCategory(category)}
                          className="text-gray-600 hover:text-blue-600 p-1"
                          title="Edit category"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleMakeDefault(category.id)}
                          className={`p-1 ${category.is_default ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-600'}`}
                          title={category.is_default ? 'Default category' : 'Make default'}
                          disabled={category.is_default}
                        >
                          <Star size={16} />
                        </button>
                        <button 
                          onClick={() => deleteCategory(category.id)}
                          className="text-gray-600 hover:text-red-600 p-1"
                          title="Delete category"
                          disabled={category.is_default}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right column - Subcategories */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">
          {selectedCategory ? `Subcategories for ${selectedCategory.name}` : 'Select a category to manage subcategories'}
        </h2>
        
        {selectedCategory ? (
          <>
            {/* Add new subcategory form */}
            <form onSubmit={handleAddSubcategory} className="mb-4 flex">
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="New subcategory name"
                className="border rounded-l px-3 py-2 w-full"
              />
              <button 
                type="submit"
                className="bg-blue-500 text-white px-3 py-2 rounded-r flex items-center"
              >
                <Plus size={18} className="mr-1" />
                Add
              </button>
            </form>
            
            {/* Subcategories list */}
            <div className="space-y-2">
              {(!selectedCategory.subcategories || selectedCategory.subcategories.length === 0) ? (
                <p className="text-gray-500 italic">No subcategories yet. Add one to organize tasks further.</p>
              ) : (
                selectedCategory.subcategories.map((subcategory) => (
                  <div 
                    key={subcategory}
                    className="border rounded p-3"
                  >
                    {editingSubcategoryName === subcategory ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editedSubcategoryName}
                          onChange={(e) => setEditedSubcategoryName(e.target.value)}
                          className="border rounded px-2 py-1 w-full mr-2"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleSaveEditSubcategory(subcategory)}
                          className="text-green-600 ml-1 p-1"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={handleCancelEditSubcategory}
                          className="text-red-600 ml-1 p-1"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span>{subcategory}</span>
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleStartEditSubcategory(subcategory)}
                            className="text-gray-600 hover:text-blue-600 p-1"
                            title="Edit subcategory"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => removeSubcategory(subcategory)}
                            className="text-gray-600 hover:text-red-600 p-1"
                            title="Delete subcategory"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-500 italic">Select a category from the left to manage its subcategories.</p>
        )}
      </div>
    </div>
  );
}
