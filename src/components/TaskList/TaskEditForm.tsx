import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Task } from '../../types/task';
import { CATEGORIES, updateSubcategoryInTags, getSubcategoryFromTags } from '../../types/categories';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Valid category keys for type safety
type CategoryKey = keyof typeof CATEGORIES;

interface TaskEditFormProps {
  taskId: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  onTaskUpdated?: () => void;
}

export function TaskEditForm({ 
  taskId, 
  onSaved, 
  onCancel, 
  onClose, 
  onTaskUpdated
}: TaskEditFormProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: null,
    category_name: '', 
    tags: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  
  const isEditing = !!taskId;
  
  // Merge callbacks to ensure compatibility with different components
  const handleSuccess = () => {
    if (onTaskUpdated) onTaskUpdated();
    if (onSaved) onSaved();
    if (onClose) onClose();
  };
  
  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };
  
  // Helper to safely check if a category exists in CATEGORIES
  const isCategoryValid = (category: string | null | undefined): category is CategoryKey => {
    return !!category && Object.keys(CATEGORIES).includes(category);
  };
  
  // Get current category safely typed
  const getCurrentCategory = (): CategoryKey | null => {
    const categoryValue = formData.category_name || formData.category;
    return isCategoryValid(categoryValue) ? categoryValue : null;
  };
  
  useEffect(() => {
    async function fetchTask() {
      if (!taskId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();
          
        if (error) throw error;
        
        // Format date for input
        let formattedData = { ...data };
        if (data.due_date) {
          formattedData.due_date = new Date(data.due_date).toISOString().split('T')[0];
        }
        
        if (isDevelopment) {
          console.log('Fetched task data:', formattedData);
        }
        
        setFormData(formattedData);
      } catch (error) {
        if (isDevelopment) {
          console.error('Error fetching task:', error);
        }
        setError('Failed to load task data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTask();
  }, [taskId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      
      if (!formData.tags?.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), newTag]
        }));
      }
      
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };
  
  const handleSelectSubcategory = (subcategory: string) => {
    // Use our shared utility to handle subcategory tags
    const updatedTags = updateSubcategoryInTags(formData.tags || [], subcategory);
    setFormData(prev => ({
      ...prev,
      tags: updatedTags
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Only include fields that exist in the database schema
      const dataToSubmit: Record<string, any> = {
        title: formData.title,
        description: formData.description || '',
        status: formData.status || 'pending',
        priority: formData.priority || 'medium',
        category_name: formData.category_name || formData.category || null,
        due_date: formData.due_date,
        tags: formData.tags || []
        // Let Supabase handle updated_at timestamp
      };
      
      // Convert estimated time to interval format if provided
      if (formData.estimated_time) {
        // Convert minutes to PostgreSQL interval format: 'X minutes'
        const minutes = parseInt(String(formData.estimated_time), 10);
        if (!isNaN(minutes)) {
          dataToSubmit.estimated_time = `${minutes} minutes`;
        }
      }
      
      if (isDevelopment) {
        console.log('Data to submit to database:', dataToSubmit);
      }
      
      let result;
      
      if (isEditing) {
        // Update existing task
        result = await supabase
          .from('tasks')
          .update(dataToSubmit)
          .eq('id', taskId);
      } else {
        // Insert new task
        const { data: userData } = await supabase.auth.getUser();
        
        result = await supabase
          .from('tasks')
          .insert([{
            ...dataToSubmit,
            // Let Supabase handle created_at timestamp
            created_by: userData.user?.id,
            is_deleted: false
          }]);
      }
      
      if (result.error) {
        if (isDevelopment) {
          console.error('Database error:', result.error);
        }
        throw result.error;
      }
      
      handleSuccess();
    } catch (error) {
      if (isDevelopment) {
        console.error('Error saving task:', error);
      }
      setError('Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the current category and check if it's valid
  const currentCategory = getCurrentCategory();
  const hasSubcategories = currentCategory !== null;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h2>
        <button 
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </div>
          
          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority || 'medium'}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          {/* Due Date and Estimated Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time (Minutes)
              </label>
              <input
                type="number"
                name="estimated_time"
                value={formData.estimated_time || ''}
                onChange={handleChange}
                placeholder="e.g., 60"
                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
              />
            </div>
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category_name"
              value={formData.category_name || formData.category || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
            >
              <option value="">-- Select Category (Optional) --</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="childcare">Childcare</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Subcategories (if a category is selected) */}
          {hasSubcategories && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES[currentCategory].map((subcategory: string) => {
                  // Check if this subcategory is already selected (exists in tags)
                  const isSelected = getSubcategoryFromTags(formData.tags || []) === subcategory;
                  
                  return (
                    <label 
                      key={subcategory} 
                      className={cn(
                        "flex items-center space-x-2 p-2 border rounded-md",
                        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="subcategory"
                        value={subcategory}
                        checked={isSelected}
                        onChange={() => handleSelectSubcategory(subcategory)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{subcategory}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleAddTag}
              placeholder="Type a tag and press Enter"
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
