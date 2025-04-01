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
  category?: string | number;
  category_name?: string;
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<TaskFilter>({
    ...defaultFilters,
    viewMode: 'list'
  });

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
    const fetchData = async () => {
      setIsLoading(true);
      await fetchTasks();
      setIsLoading(false);
    };
    
    fetchData();
    
    // Debug: Log task categories
    console.log('Tasks:', tasks.map(task => ({ 
      id: task.id, 
      title: task.title, 
      category: task.category 
    })));
  }, []);

  useEffect(() => {
    // Debug - log all tasks to see if they have categories
    if (tasks.length > 0) {
      console.log('All Tasks with Categories:', 
        tasks.map(task => ({
          id: task.id,
          title: task.title,
          category: task.category
        }))
      );
    }
  }, [tasks]);

  useEffect(() => {
    // Debug the task data with more detailed logging
    if (tasks.length > 0) {
      console.log("DEBUG - All tasks:", tasks);
      console.log("DEBUG - First task category:", tasks[0].category);
      console.log("DEBUG - First task category_name:", tasks[0].category_name);
    }
  }, [tasks]);

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
    if (filters.category.length > 0 && task.category && !filters.category.includes(task.category.toString())) {
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
          ? aCategory.toString().localeCompare(bCategory.toString())
          : bCategory.toString().localeCompare(aCategory.toString());
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
      viewMode: 'list', // Preserve the current view mode
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
    setSelectedTask(task);
    setIsEditModalOpen(true);
    setActiveDropdown(null); // Close the dropdown
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTasks().finally(() => {
      setIsRefreshing(false);
    });
  };

  // Get category color based on task id or assigned category
  const getCategoryStyle = (task: Task) => {
    // Use category_name or category if available
    if (task.category_name === 'work' || task.category === 'work' || task.category === 1) {
      return "border-l-green-500";
    } else if (task.category_name === 'personal' || task.category === 'personal' || task.category === 2) {
      return "border-l-blue-500";
    } else if (task.category_name === 'childcare' || task.category === 'childcare' || task.category === 3) {
      return "border-l-cyan-500";
    }
    
    // If no category, assign one based on task ID
    const taskIdNum = parseInt(task.id.replace(/-/g, '').substring(0, 8), 16);
    const categoryIndex = taskIdNum % 3;
    
    switch(categoryIndex) {
      case 0: return "border-l-green-500"; // Work
      case 1: return "border-l-blue-500";  // Personal
      case 2: return "border-l-cyan-500";  // Childcare
      default: return "border-l-gray-500";
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
        <div className="flex flex-col space-y-2">
          {sortedTasks.map((task) => (
            <div 
              key={task.id}
              className={cn(
                "relative flex flex-col p-4 rounded-lg shadow-sm transition-all",
                "hover:shadow-md mb-2 border border-gray-200 bg-white"
              )}
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
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-30">
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
              
              {/* Task Title - Prominent in top left */}
              <h3 className={cn(
                "absolute left-3 top-3 text-left z-10 font-bold text-lg max-w-[65%] truncate shadow-sm px-3 py-1 rounded-r-lg bg-white",
                "border-l-4",
                getCategoryStyle(task)
              )}>
                {task.title}
              </h3>

              {/* Task Content */}
              <div className="pr-6 mt-12">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Category and tags */}
                    {task.category && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        task.category === 'work' && "bg-green-100 text-green-800",
                        task.category === 'personal' && "bg-blue-100 text-blue-800",
                        task.category === 'childcare' && "bg-cyan-100 text-cyan-800",
                      )}>
                        {task.category}
                      </span>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 2).map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    {task.due_date && (
                      <span className="text-xs text-gray-500 mr-4">
                        Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {task.description}
                </p>
                
                <div className="flex justify-between items-end mt-auto">
                  {/* Task action buttons - bottom left */}
                  <div className="flex items-center gap-1.5">
                    {task.status === 'pending' && (
                      <button 
                        onClick={() => updateTaskStatus(task.id, 'active')}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                        title="Start task"
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'active' && (
                      <>
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded mr-1"
                          title="Pause task"
                        >
                          Pause
                        </button>
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                          title="Complete task"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {task.status === 'in_progress' && (
                      <button 
                        onClick={() => updateTaskStatus(task.id, 'active')}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                        title="Resume task"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                  
                  {/* Date added - bottom right */}
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">
                      {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
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

      {/* Edit task modal */}
      {isEditModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <TaskEditForm
            taskId={selectedTask.id}
            onClose={() => setIsEditModalOpen(false)}
            onTaskUpdated={fetchTasks}
          />
        </div>
      )}
    </div>
  );
}
