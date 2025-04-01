import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw } from 'lucide-react';
import { TaskEditForm } from './TaskEditForm';
import { FilterPanel, defaultFilters, TaskFilter } from './FilterPanel';
import { TaskContainer } from './TaskContainer';
import { SearchBar } from './SearchBar';
import { filterAndSortTasks } from '../../lib/taskUtils';
import { Task } from '../../types/task';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [filters, setFilters] = useState<TaskFilter>({
    ...defaultFilters,
    viewMode: 'list'
  });

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      ...defaultFilters,
      viewMode: filters.viewMode // Keep current view mode when resetting
    });
    setSearchQuery('');
  };

  // Filter and sort tasks
  const sortedTasks = filterAndSortTasks(tasks, filters, searchQuery);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("You must be logged in to view tasks");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', session.user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        if (isDevelopment) {
          console.error("Error fetching tasks:", error);
        }
        setError("Failed to load tasks. Please try again later.");
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      if (isDevelopment) {
        console.error("Exception fetching tasks:", err);
      }
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle task status change
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus
        })
        .eq('id', taskId);

      if (error) {
        if (isDevelopment) {
          console.error("Error updating task status:", error);
        }
        throw new Error("Failed to update task status");
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      if (isDevelopment) {
        console.error("Exception updating task status:", err);
      }
      setError("Failed to update task status. Please try again.");
    }
  };

  // Delete task handling
  const openDeleteModal = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_deleted: true })
        .eq('id', taskToDelete);

      if (error) {
        if (isDevelopment) {
          console.error("Error deleting task:", error);
        }
        throw new Error("Failed to delete task");
      }

      // Update local state
      setTasks(prev => prev.filter(task => task.id !== taskToDelete));
      
      // Close the modal
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      if (isDevelopment) {
        console.error("Exception deleting task:", err);
      }
      setError("Failed to delete task. Please try again.");
    }
  };

  // Function to handle editing a task
  const handleEdit = (taskId: string) => {
    // Find the task by ID and open edit modal
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (taskToEdit) {
      setEditTaskId(taskToEdit.id);
      setIsEditModalOpen(true);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTasks().finally(() => {
      setIsRefreshing(false);
    });
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Tasks</h1>
        <TaskContainer 
          isLoading={true}
          tasks={[]}
          viewMode={filters.viewMode}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center mt-2 sm:mt-0">
          <button
            onClick={handleRefresh}
            className="flex items-center text-gray-600 hover:text-indigo-600 mr-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
          />

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Task Container */}
          <TaskContainer
            isLoading={isLoading}
            tasks={sortedTasks}
            viewMode={filters.viewMode}
            onStatusChange={updateTaskStatus}
            onEdit={handleEdit}
            onDelete={openDeleteModal}
          />

          {sortedTasks.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
              <p className="mt-2 text-gray-500">
                {tasks.length > 0 
                  ? 'Try adjusting your filters or search query'
                  : 'Create your first task to get started'
                }
              </p>
              {tasks.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Panel */}
        <div className="order-first md:order-last">
          <FilterPanel 
            filters={filters} 
            onChange={setFilters}
            taskCount={tasks.length}
            filteredCount={sortedTasks.length}
            onReset={resetFilters}
          />
        </div>
      </div>

      {/* Task Edit Modal */}
      {isEditModalOpen && editTaskId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Edit Task</h2>
            </div>
            <div className="p-4">
              <TaskEditForm
                taskId={editTaskId}
                onSaved={() => {
                  // Refresh tasks after saving
                  fetchTasks();
                  setIsEditModalOpen(false);
                  setEditTaskId(null);
                }}
                onCancel={() => {
                  setIsEditModalOpen(false);
                  setEditTaskId(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Confirm Delete</h2>
            </div>
            <div className="p-4">
              <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end p-4 space-x-2 border-t">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
