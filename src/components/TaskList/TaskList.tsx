import { useEffect, useState } from 'react';
import { MoreVertical, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { TaskEditForm } from './TaskEditForm';
import { FilterPanel, TaskFilter, defaultFilters } from './FilterPanel';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

// Define the Task type based on our database schema
type Task = {
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
  subcategory?: string;
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<TaskFilter>(defaultFilters);

  async function fetchTasks() {
    try {
      setIsRefreshing(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated. Please log in.");
        return;
      }

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('created_by', session.user.id)
        .eq('is_deleted', false);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  // Function to quickly update a task's status
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      
      // Update the task in the local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updated_at: new Date().toISOString() } 
          : task
      ));
    } catch (error: any) {
      console.error('Error updating task status:', error);
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }
    
    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }
    
    // Category filter (only if task has a category)
    if (filters.category.length > 0 && task.category && !filters.category.includes(task.category)) {
      return false;
    }
    
    // Hide completed tasks
    if (!filters.showCompleted && task.status === 'completed') {
      return false;
    }
    
    return true;
  });

  // Sort tasks based on sort options
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (filters.sortBy) {
      case 'priority': {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      case 'dueDate': {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
        return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      case 'createdAt': {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      case 'title': {
        return filters.sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      case 'status': {
        const statusOrder = { active: 1, in_progress: 2, completed: 3, pending: 0 };
        const aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
        const bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      case 'category': {
        const aCategory = a.category || '';
        const bCategory = b.category || '';
        return filters.sortOrder === 'asc'
          ? aCategory.localeCompare(bCategory)
          : bCategory.localeCompare(aCategory);
      }
      default:
        return 0;
    }
  });

  // Function to reset all filters
  const resetFilters = () => {
    setFilters({
      status: [],
      priority: [],
      category: [],
      viewMode: filters.viewMode, // Preserve the current view mode
      sortBy: 'createdAt',
      sortOrder: 'desc',
      showCompleted: false
    });
  };

  // Toggle the dropdown menu for a task
  const toggleDropdown = (taskId: string) => {
    if (activeDropdown === taskId) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(taskId);
    }
  };

  // Function to handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_deleted: true })
        .eq('id', taskToDelete);

      if (error) throw error;

      // Remove the task from the UI
      setTasks(tasks.filter(task => task.id !== taskToDelete));
      
      // Close the modal
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

  // Open the delete confirmation modal
  const openDeleteModal = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null); // Close the dropdown
  };

  // Open the edit modal
  const openEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
    setActiveDropdown(null); // Close the dropdown
  };

  // Handle task update
  const handleTaskUpdated = () => {
    // Refetch tasks to get the updated data
    fetchTasks();
    
    // Close the edit modal
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  };

  const handleRefresh = () => {
    fetchTasks();
  };

  // Helper function to get category color
  const getCategoryColor = (category?: string) => {
    if (!category) return 'border-gray-200';
    
    // Map categories to colors
    switch (category.toLowerCase()) {
      case 'work': return 'border-blue-400';
      case 'personal': return 'border-purple-400';
      case 'childcare': return 'border-green-400';
      case 'health': return 'border-red-400';
      case 'education': return 'border-yellow-400';
      case 'finance': return 'border-indigo-400';
      default: return 'border-gray-300';
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Error loading tasks</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Your Tasks</h2>
        <button 
          onClick={handleRefresh}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isRefreshing && (
        <div className="text-center py-2 text-sm text-gray-500">
          Refreshing tasks...
        </div>
      )}

      {/* Filter Panel */}
      <FilterPanel 
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
      />

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No tasks found</h3>
          <p className="text-gray-500">Create your first task to get started!</p>
        </div>
      ) : (
        <div className={filters.viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col space-y-2"}>
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "bg-white rounded-lg shadow-md overflow-hidden relative",
                filters.viewMode === 'list' ? "flex items-center p-3" : "p-4",
                "border-l-4 hover:shadow-lg transition-shadow",
                getCategoryColor(task.category)
              )}
              style={{ borderLeftColor: task.priority === 'urgent' ? '#EF4444' : 
                                        task.priority === 'high' ? '#F59E0B' : 
                                        task.priority === 'medium' ? '#3B82F6' : '#10B981' }}
            >
              {/* Dropdown Menu Button */}
              <div className={cn(
                "absolute right-3 top-3 z-20 flex items-center gap-2"
              )}>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  task.status === 'active' && "bg-green-100 text-green-800",
                  task.status === 'in_progress' && "bg-yellow-100 text-yellow-800",
                  task.status === 'completed' && "bg-blue-100 text-blue-800",
                  task.status === 'pending' && "bg-gray-100 text-gray-800"
                )}>
                  {task.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => toggleDropdown(task.id)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </button>
                
                {/* Dropdown Menu */}
                {activeDropdown === task.id && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => openEditModal(task)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(task.id)}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Task Content - List View */}
              {filters.viewMode === 'list' ? (
                <div className="flex-grow pr-10">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    
                    {/* Task action buttons */}
                    <div className="flex items-center gap-1.5">
                      {task.status === 'pending' && (
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'active')}
                          className="p-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'active' && (
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="p-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded"
                        >
                          Pause
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'active')}
                          className="p-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded"
                        >
                          Resume
                        </button>
                      )}
                      {task.status !== 'completed' && (
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="p-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                    
                    {task.category && (
                      <span className="text-xs text-gray-600">
                        {task.category}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Task Content - Grid View */
                <div className="pr-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      
                      {/* Task action buttons */}
                      <div className="flex items-center gap-1">
                        {task.status === 'pending' && (
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'active')}
                            className="p-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                            title="Start task"
                          >
                            S
                          </button>
                        )}
                        {task.status === 'active' && (
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="p-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded"
                            title="Pause task"
                          >
                            P
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'active')}
                            className="p-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded"
                            title="Resume task"
                          >
                            R
                          </button>
                        )}
                        {task.status !== 'completed' && (
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="p-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded"
                            title="Complete task"
                          >
                            C
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
                  
                  {task.description && (
                    <div 
                      className="mb-3 text-sm text-gray-600 line-clamp-2" 
                      dangerouslySetInnerHTML={{ __html: task.description || '' }}
                    />
                  )}
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {task.category && (
                        <span className="mr-2">{task.category}</span>
                      )}
                      <span>{format(new Date(task.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Confirm Deletion</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && taskToEdit && (
        <TaskEditForm 
          task={{
            id: taskToEdit.id,
            title: taskToEdit.title,
            description: taskToEdit.description,
            status: taskToEdit.status,
            priority: taskToEdit.priority,
            category: taskToEdit.category,
            subcategory: taskToEdit.subcategory,
            tags: taskToEdit.tags || undefined
          }}
          onClose={() => {
            setIsEditModalOpen(false);
            setTaskToEdit(null);
          }}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
}
