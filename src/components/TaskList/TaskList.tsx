import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw } from 'lucide-react';
import { TaskEditForm } from './TaskEditForm';
import { FilterPanel, defaultFilters, TaskFilter } from './FilterPanel';
import { TaskCard } from './TaskCard';
import { TaskContainer } from './TaskContainer';
import { SearchBar } from './SearchBar';
import { filterAndSortTasks } from '../../lib/taskUtils';
import { Task } from '../../types/task';

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchTasks();
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

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

      if (data) {
        // Debug log to see the actual data from the database
        console.log('Fetched tasks full data:', data);
        console.log('Fetched tasks categories:', data.map(task => ({
          id: task.id,
          title: task.title,
          category: task.category, 
          category_name: task.category_name,
          category_type: typeof task.category
        })));
        
        setTasks(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
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
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      
      // Optimistically update the UI
      setTasks(currentTasks => 
        currentTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Generate the filtered and sorted task list
  const sortedTasks = filterAndSortTasks(tasks, filters, searchQuery);

  // Function to reset all filters
  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchQuery('');
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
          isEmpty={false}
          viewMode={filters.viewMode}
        >
          {[]}
        </TaskContainer>
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

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar 
          onSearch={setSearchQuery} 
          initialValue={searchQuery}
          placeholder="Search by title, description, status, priority, or category..."
        />
      </div>

      {/* Filter Panel */}
      <FilterPanel 
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
      />

      {/* Task List */}
      <TaskContainer 
        isLoading={isLoading && !isRefreshing}
        isEmpty={sortedTasks.length === 0}
        viewMode={filters.viewMode}
      >
        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={handleEdit}
            onDelete={openDeleteModal}
            updateTaskStatus={updateTaskStatus}
          />
        ))}
      </TaskContainer>

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
      {isEditModalOpen && editTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <TaskEditForm
            taskId={editTaskId}
            onClose={() => setIsEditModalOpen(false)}
            onTaskUpdated={fetchTasks}
          />
        </div>
      )}
    </div>
  );
}
