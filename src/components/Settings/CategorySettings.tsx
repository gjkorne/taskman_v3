import { useCategoryManager } from '../../hooks/useCategoryManager';
import { CategoryForm } from './CategoryForm';
import { CategoryItem } from './CategoryItem';
import { SubcategoryForm } from './SubcategoryForm';
import { SubcategoryItem } from './SubcategoryItem';
import { CategoryVisibilitySettings } from './CategoryVisibilitySettings';
import { useState } from 'react';
import * as Tabs from '../UI/Tabs';

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

  const [activeTab, setActiveTab] = useState<'management' | 'visibility'>('management');

  // Get the currently selected category
  const selectedCategory = getSelectedCategory();

  // Handler functions
  const handleAddCategory = async (name: string) => {
    await createNewCategory(name);
  };

  const handleEditCategory = async (id: string, name: string) => {
    await updateCategory(id, { name });
  };

  const handleAddSubcategory = async (name: string) => {
    if (!selectedCategoryId) return;
    await addSubcategory(name);
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
    <div className="p-4">
      <Tabs.Tabs value={activeTab} onValueChange={(value: 'management' | 'visibility') => setActiveTab(value)}>
        <Tabs.TabsList className="mb-4">
          <Tabs.TabsTrigger value="management">Manage Categories</Tabs.TabsTrigger>
          <Tabs.TabsTrigger value="visibility">Category Visibility</Tabs.TabsTrigger>
        </Tabs.TabsList>
        
        <Tabs.TabsContent value="management">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Categories */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Categories</h2>
              
              {/* Add new category form */}
              <CategoryForm onAddCategory={handleAddCategory} />
              
              {/* Categories list */}
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-gray-500 italic">No categories yet. Create one to get started.</p>
                ) : (
                  categories.map((category) => (
                    <CategoryItem 
                      key={category.id}
                      category={category}
                      selectedCategoryId={selectedCategoryId}
                      onSelect={setActiveCategory}
                      onEdit={handleEditCategory}
                      onDelete={async (id) => { await deleteCategory(id); }}
                      onMakeDefault={handleMakeDefault}
                    />
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
                  <SubcategoryForm onAddSubcategory={handleAddSubcategory} />
                  
                  {/* Subcategories list */}
                  <div className="space-y-2">
                    {(!selectedCategory.subcategories || selectedCategory.subcategories.length === 0) ? (
                      <p className="text-gray-500 italic">No subcategories yet. Add one to organize tasks further.</p>
                    ) : (
                      selectedCategory.subcategories.map((subcategory) => (
                        <SubcategoryItem 
                          key={subcategory}
                          name={subcategory}
                          onEdit={async (oldName, newName) => { await renameSubcategory(oldName, newName); }}
                          onDelete={async (name) => { await removeSubcategory(name); }}
                        />
                      ))
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">Select a category from the left to manage its subcategories.</p>
              )}
            </div>
          </div>
        </Tabs.TabsContent>
        
        <Tabs.TabsContent value="visibility">
          <div className="bg-white rounded-lg shadow p-4">
            <CategoryVisibilitySettings />
          </div>
        </Tabs.TabsContent>
      </Tabs.Tabs>
    </div>
  );
}
