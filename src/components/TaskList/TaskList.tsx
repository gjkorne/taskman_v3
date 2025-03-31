import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Flag, Clock, Calendar, CheckCircle, RefreshCw, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { TaskEditForm } from './TaskEditForm';

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

  async function fetchTasks() {
    try {
      setIsRefreshing(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        setError('You must be logged in to view tasks');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', sessionData.session.user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

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

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-yellow-500';
      case 'medium': return 'text-blue-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Helper to format estimated_time from interval type
  const formatEstimatedTime = (interval: string | null) => {
    if (!interval) return null;
    // Simple formatting for interval - this can be enhanced
    return interval.replace(/(\d+):(\d+):(\d+)/, '$1h $2m');
  };

  const handleRefresh = () => {
    fetchTasks();
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

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No tasks found</h3>
          <p className="text-gray-500">Create your first task to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 hover:shadow-lg transition-shadow"
              style={{ borderLeftColor: task.priority === 'urgent' ? '#EF4444' : 
                                        task.priority === 'high' ? '#F59E0B' : 
                                        task.priority === 'medium' ? '#3B82F6' : '#10B981' }}
            >
              {/* Task Header */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 line-clamp-2">{task.title}</h3>
                <div className="flex items-center space-x-1 relative">
                  <Flag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
                  <button 
                    onClick={() => toggleDropdown(task.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === task.id && (
                    <div className="absolute right-0 top-6 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => openEditModal(task)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Task
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                          onClick={() => openDeleteModal(task.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Task Description - if exists */}
              {task.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
              )}

              {/* Task Metadata */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                {task.status && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {task.status}
                  </span>
                )}
                
                {task.estimated_time && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatEstimatedTime(task.estimated_time)}
                  </span>
                )}
                
                {task.due_date && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(task.due_date)}
                  </span>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {task.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Created Date */}
              <div className="text-xs text-gray-400 mt-3">
                Created {formatDate(task.created_at)}
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
