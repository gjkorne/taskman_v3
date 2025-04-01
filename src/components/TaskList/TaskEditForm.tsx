import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const CATEGORIES = {
  childcare: [
    'Core Care',
    'Play & Engagement',
    'Learning & Schoolwork',
    'Routines',
    'Outings & Activities',
    'Admin'
  ],
  work: [
    'Core Execution',
    'Planning & Strategy',
    'Communication & Meetings',
    'Learning & Research',
    'Maintenance/Admin',
    'Projects & Deliverables'
  ],
  personal: [
    'Health & Wellness',
    'Relationships & Social',
    'Home & Chores',
    'Finance & Admin',
    'Growth & Learning',
    'Fun & Recreation'
  ],
  other: [
    'Core',
    'Unexpected/Interruptions',
    'Unsorted',
    'Overflow',
    'External Requests',
    'Reflections & Journaling'
  ]
} as const;

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_time: string | null;
  tags: string[] | null;
  created_at: string;
  created_by: string;
  category?: string;
  category_name?: string;
}

interface TaskEditFormProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export function TaskEditForm({ taskId, onClose, onTaskUpdated }: TaskEditFormProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: null,
    category: 'work', // Default to work category
    tags: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  
  const isEditing = !!taskId;
  
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
        
        // Map category_name to category for form compatibility
        if (data.category_name && !data.category) {
          formattedData.category = data.category_name;
        }
        
        console.log('Fetched task data:', formattedData);
        
        setFormData(formattedData);
      } catch (error) {
        console.error('Error fetching task:', error);
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
    const newTag = `subcategory:${subcategory}`;
    if (!formData.tags?.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags?.filter(tag => tag !== newTag) || []
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Debug log to see what's being submitted
      console.log('Submitting form data:', formData);
      
      // Map category to category_name for database
      // Only include fields that exist in the database schema
      const dataToSubmit: Record<string, any> = {
        title: formData.title,
        description: formData.description || '',
        status: formData.status || 'pending',
        priority: formData.priority || 'medium',
        category_name: formData.category || null, // Use the field name expected by database
        due_date: formData.due_date,
        tags: formData.tags || [],
        updated_at: new Date().toISOString()
      };
      
      // Convert estimated time to interval format if provided
      if (formData.estimated_time) {
        // Convert minutes to PostgreSQL interval format: 'X minutes'
        dataToSubmit.estimated_time = `${formData.estimated_time} minutes`;
      }
      
      // Debug log to see data after transformation
      console.log('Data to submit to database:', dataToSubmit);
      
      let result;
      
      if (isEditing) {
        // Update existing task
        result = await supabase
          .from('tasks')
          .update(dataToSubmit)
          .eq('id', taskId);
      } else {
        // Insert new task
        result = await supabase
          .from('tasks')
          .insert([{
            ...dataToSubmit,
            created_at: new Date().toISOString(),
            created_by: (await supabase.auth.getUser()).data.user?.id,
            is_deleted: false // Explicitly set is_deleted to false
          }]);
      }
      
      if (result.error) {
        console.error('Database error:', result.error);
        throw result.error;
      }
      
      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setError('Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h2>
        <button 
          onClick={onClose}
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
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority || 'medium'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">-- Select Category --</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="childcare">Childcare</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time (minutes)
              </label>
              <input
                type="number"
                min="0"
                name="estimated_time"
                value={formData.estimated_time || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., 60"
              />
              <p className="mt-1 text-xs text-gray-500">Enter total minutes (e.g., 300 for 5 hours)</p>
            </div>
          </div>
          
          {/* Subcategory selection - only shown when a category is selected */}
          {formData.category && formData.category in CATEGORIES && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES[formData.category as keyof typeof CATEGORIES].map((subcategory) => (
                  <label 
                    key={subcategory} 
                    className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      value={subcategory}
                      id={`subcategory-${subcategory.replace(/\s+/g, '-').toLowerCase()}`}
                      name="subcategory"
                      checked={formData.tags?.includes(`subcategory:${subcategory}`)}
                      onChange={() => handleSelectSubcategory(subcategory)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{subcategory}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">Subcategory will be saved as a tag</p>
            </div>
          )}
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (press Enter to add)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleAddTag}
              placeholder="Add a tag..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span 
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
            )}
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "px-4 py-2 bg-blue-600 text-white rounded-md",
                isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
              )}
            >
              {isLoading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
