import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface SimpleSettingsPageProps {
  // Add props as needed
}

// UI Density options from project memory
type DensityLevel = 'COMPACT' | 'NORMAL' | 'COMFORTABLE';

const SimpleSettingsPage: React.FC<SimpleSettingsPageProps> = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('appearance');
  const [density, setDensity] = useState<DensityLevel>('NORMAL');
  
  // Get stored settings on mount
  useEffect(() => {
    // Get saved density preference
    const savedDensity = localStorage.getItem('taskman_ui_density');
    if (savedDensity) {
      setDensity(savedDensity as DensityLevel);
    }
  }, []);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      try {
        // Query to check if user has admin role
        const { data, error } = await supabase
          .from('user_role_assignments')
          .select('user_roles(name)')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        const isAdminUser = data?.user_roles?.name === 'admin';
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [user]);
  
  // Settings sections
  const sections = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'data', label: 'Data Management', icon: '💾' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];
  
  if (isAdmin) {
    sections.push({ id: 'admin', label: 'Admin Settings', icon: '🔒' });
  }
  
  // Save settings to localStorage with consistent prefix
  const saveSettings = (key: string, value: any) => {
    localStorage.setItem(`taskman_${key}`, value);
  };
  
  // Handle UI density change
  const changeDensity = (newDensity: DensityLevel) => {
    setDensity(newDensity);
    saveSettings('ui_density', newDensity);
  };
  
  // Category management section
  const CategorySection = () => {
    const [categories, setCategories] = useState<Array<{ id: string, name: string }>>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [editingCategory, setEditingCategory] = useState<{ id: string, name: string } | null>(null);
    const [editName, setEditName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    // Fetch categories
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('id, name')
            .order('name');
          
          if (error) throw error;
          setCategories(data || []);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
      
      fetchCategories();
    }, []);

    // Create a new category
    const handleCreateCategory = async () => {
      if (!newCategoryName.trim()) return;
      
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({ name: newCategoryName.trim() })
          .select()
          .single();
        
        if (error) throw error;
        
        // Add new category to the list
        setCategories([...categories, data]);
        setNewCategoryName('');
      } catch (error) {
        console.error('Error creating category:', error);
      }
    };

    // Set up editing for a category
    const startEditing = (category: { id: string, name: string }) => {
      setEditingCategory(category);
      setEditName(category.name);
    };

    // Cancel editing
    const cancelEditing = () => {
      setEditingCategory(null);
      setEditName('');
    };

    // Save edited category
    const saveEditedCategory = async () => {
      if (!editingCategory || !editName.trim()) return;

      try {
        const { error } = await supabase
          .from('categories')
          .update({ name: editName.trim() })
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        
        // Update the category in the list
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? { ...cat, name: editName.trim() } : cat
        ));
        
        // Reset editing state
        setEditingCategory(null);
        setEditName('');
      } catch (error) {
        console.error('Error updating category:', error);
      }
    };

    // Confirm deletion modal
    const confirmDeleteCategory = (categoryId: string) => {
      setCategoryToDelete(categoryId);
      setIsDeleting(true);
    };

    // Delete a category
    const deleteCategory = async () => {
      if (!categoryToDelete) return;
      
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryToDelete);
        
        if (error) throw error;
        
        // Remove the category from the list
        setCategories(categories.filter(cat => cat.id !== categoryToDelete));
        
        // Reset deletion state
        setCategoryToDelete(null);
        setIsDeleting(false);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    };

    // Sync categories
    const handleSyncCategories = async () => {
      setIsSyncing(true);
      try {
        // Just a visual indication that sync is happening
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refetch categories
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error synchronizing categories:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Categories</h2>
          <button 
            onClick={handleSyncCategories}
            disabled={isSyncing}
            className="text-sm px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 flex items-center space-x-1"
          >
            {isSyncing ? (
              <>
                <span className="h-4 w-4 border-2 border-t-blue-500 border-r-blue-500 border-b-blue-500 border-l-transparent rounded-full animate-spin"></span>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Sync Categories</span>
              </>
            )}
          </button>
        </div>
        
        {/* Create new category */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Create New Category</h3>
          <div className="flex">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="flex-1 p-2 border rounded-l"
            />
            <button
              onClick={handleCreateCategory}
              className="px-4 py-2 bg-indigo-600 text-white rounded-r hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </div>
        
        {/* Category list */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Existing Categories</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500">No categories found. Create one above.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {categories.map(category => (
                <li key={category.id} className="flex justify-between p-2 border-b">
                  {editingCategory?.id === category.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 p-1 border rounded"
                        autoFocus
                      />
                      <div className="flex space-x-1">
                        <button 
                          onClick={saveEditedCategory}
                          className="text-green-500 hover:text-green-700 p-1"
                          title="Save"
                        >
                          ✅
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="Cancel"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>{category.name}</span>
                      <div className="space-x-2">
                        <button 
                          onClick={() => startEditing(category)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => confirmDeleteCategory(category.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delete confirmation modal */}
        {isDeleting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
              <p className="mb-6">
                Are you sure you want to delete this category? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setCategoryToDelete(null);
                    setIsDeleting(false);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteCategory}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Appearance Settings</h2>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-3">UI Density</h3>
              <p className="text-sm text-gray-600 mb-3">
                Change the spacing and sizing of elements throughout the application.
              </p>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => changeDensity('COMPACT')}
                  className={`px-4 py-2 rounded transition-colors ${
                    density === 'COMPACT' 
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Compact
                </button>
                <button 
                  onClick={() => changeDensity('NORMAL')}
                  className={`px-4 py-2 rounded transition-colors ${
                    density === 'NORMAL' 
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Normal
                </button>
                <button 
                  onClick={() => changeDensity('COMFORTABLE')}
                  className={`px-4 py-2 rounded transition-colors ${
                    density === 'COMFORTABLE' 
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Comfortable
                </button>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded border">
                <h4 className="text-sm font-medium mb-2">Preview</h4>
                <div className={`border rounded bg-white ${
                  density === 'COMPACT' ? 'p-1' : 
                  density === 'NORMAL' ? 'p-3' : 'p-5'
                }`}>
                  <div className={`flex items-center space-x-2 ${
                    density === 'COMPACT' ? 'text-sm' : 
                    density === 'NORMAL' ? 'text-base' : 'text-lg'
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-green-500"></span>
                    <span>Task Item Example</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-3">Theme</h3>
              <div className="flex space-x-4">
                <button className="px-4 py-2 rounded bg-indigo-100 hover:bg-indigo-200">Light</button>
                <button className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Dark</button>
                <button className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">System</button>
              </div>
            </div>
          </div>
        );
        
      case 'categories':
        return <CategorySection />;
        
      case 'data':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Data Management</h2>
            <p className="text-gray-600">Manage your data and exports</p>
            
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <h3 className="font-medium mb-2">Export Tasks</h3>
                <button className="px-4 py-2 rounded bg-blue-100 hover:bg-blue-200">Export to CSV</button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Backup Settings</h3>
                <button className="px-4 py-2 rounded bg-blue-100 hover:bg-blue-200">Backup Preferences</button>
              </div>
            </div>
          </div>
        );
        
      case 'preferences':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">User Preferences</h2>
            
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <h3 className="font-medium mb-2">Default View</h3>
                <select className="border p-2 rounded w-full max-w-xs">
                  <option>Home</option>
                  <option>Tasks</option>
                  <option>Timer</option>
                  <option>Calendar</option>
                </select>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="notif-due" className="mr-2" />
                    <label htmlFor="notif-due">Due date reminders</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="notif-complete" className="mr-2" />
                    <label htmlFor="notif-complete">Task completion</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'admin':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Admin Settings</h2>
            <p className="text-gray-600">These settings are only available to administrators</p>
            
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <h3 className="font-medium mb-2">User Management</h3>
                <button className="px-4 py-2 rounded bg-indigo-100 hover:bg-indigo-200">View Users</button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">System Diagnostics</h3>
                <button className="px-4 py-2 rounded bg-indigo-100 hover:bg-indigo-200">Run Diagnostics</button>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Select a section to view settings</div>;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      
      <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${
                      activeSection === section.id 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span>{section.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {loading ? (
              <div className="py-10 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading settings...</p>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSettingsPage;
