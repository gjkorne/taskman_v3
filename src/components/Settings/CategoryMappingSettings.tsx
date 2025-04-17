import { useState } from 'react';
import { useCategories } from '../../contexts/category';
import { useTaskData } from '../../contexts/task';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { useToast } from '../../components/Toast';

export function CategoryMappingSettings() {
  const { categories } = useCategories();
  const { tasks, refreshTasks } = useTaskData();
  const { addToast } = useToast();
  
  const [sourceCategory, setSourceCategory] = useState<string>('');
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get all unique category names from tasks
  const uniqueCategories = new Set<string>();
  tasks.forEach(task => {
    if (task.category_name && !task.is_deleted) {
      uniqueCategories.add(task.category_name);
    }
  });
  
  // Convert to array and sort
  const allTaskCategories = Array.from(uniqueCategories).sort();
  
  // Standard/default categories (you can customize this list)
  const standardCategories = categories
    .filter(cat => !cat.id.startsWith('virtual-'))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Handle mapping categories
  const handleMapCategories = async () => {
    if (!sourceCategory || !targetCategory) {
      addToast('Please select both source and target categories', 'warning');
      return;
    }
    
    if (sourceCategory === targetCategory) {
      addToast('Source and target categories must be different', 'warning');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Get affected tasks
      const affectedTasks = tasks.filter(
        task => task.category_name?.toLowerCase() === sourceCategory.toLowerCase()
      );
      
      if (affectedTasks.length === 0) {
        addToast('No tasks found with the selected source category', 'info');
        setIsProcessing(false);
        return;
      }
      
      // Get target category ID
      const targetCategoryObj = categories.find(
        cat => cat.name.toLowerCase() === targetCategory.toLowerCase()
      );
      
      if (!targetCategoryObj) {
        addToast('Target category not found', 'error');
        setIsProcessing(false);
        return;
      }
      
      // Get task service
      const taskService = ServiceRegistry.getTaskService();
      
      // Update tasks
      let successCount = 0;
      for (const task of affectedTasks) {
        try {
          await taskService.updateTask(task.id, {
            category: targetCategory,  // Maps to category_name in DB
            categoryId: targetCategoryObj.id
          });
          successCount++;
        } catch (error) {
          console.error(`Error updating task ${task.id}:`, error);
        }
      }
      
      // Refresh tasks
      await refreshTasks();
      
      addToast(`Successfully mapped ${successCount} tasks from "${sourceCategory}" to "${targetCategory}"`, 'success');
      
      // Reset form
      setSourceCategory('');
      setTargetCategory('');
    } catch (error) {
      console.error('Error mapping categories:', error);
      addToast('An error occurred while mapping categories', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Map Categories</h2>
      <p className="text-gray-600 mb-4">
        Use this tool to move tasks from one category to another. This is useful for consolidating custom categories into standard ones.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Source Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Category (From)
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={sourceCategory}
            onChange={(e) => setSourceCategory(e.target.value)}
            disabled={isProcessing}
          >
            <option value="">Select a category</option>
            {allTaskCategories.map((category) => (
              <option key={`source-${category}`} value={category}>
                {category}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {tasks.filter(t => t.category_name?.toLowerCase() === sourceCategory.toLowerCase()).length} tasks will be affected
          </p>
        </div>
        
        {/* Target Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Category (To)
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={targetCategory}
            onChange={(e) => setTargetCategory(e.target.value)}
            disabled={isProcessing}
          >
            <option value="">Select a category</option>
            {standardCategories.map((category) => (
              <option key={`target-${category.id}`} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          onClick={handleMapCategories}
          disabled={isProcessing || !sourceCategory || !targetCategory}
        >
          {isProcessing ? 'Processing...' : 'Map Categories'}
        </button>
      </div>
    </div>
  );
}
