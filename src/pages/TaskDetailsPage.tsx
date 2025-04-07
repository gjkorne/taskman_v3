import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, Clock, CheckCircle, Save, Trash2 } from 'lucide-react';
import { taskService } from '../services/api/taskService';
import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { TaskSessions } from '../components/TimeSessions/TaskSessions';
import { TimerControls } from '../components/Timer/TimerControls';
import { useTaskActions } from '../hooks/useTaskActions';
import { getPriorityBorderColor, getDueDateStyling } from '../lib/taskUtils';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { determineStatusFromSessions } from '../utils/taskStatusUtils';
import { useTimeSessionData } from '../contexts/timeSession';
import { useTimer } from '../contexts/TimerCompat';
import { supabase } from '../lib/supabase';

export function TaskDetailsPage({ isEditMode = false }: { isEditMode?: boolean }) {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const { sessions } = useTimeSessionData();
  const timer = useTimer();
  const timerState = timer.timerState;
  
  const { updateTaskStatus } = useTaskActions({
    onSuccess: () => {
      // Refresh task data after status change
      fetchTask();
    },
    onError: (err) => {
      setError('Failed to update task status');
      console.error(err);
    }
  });

  // Fetch task data
  const fetchTask = async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await taskService.getTaskById(taskId);
      
      if (apiError) throw apiError;
      if (!data) throw new Error('Task not found');
      
      setTask(data);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  // Get corrected task status based on sessions and timer state
  const getCorrectedTaskStatus = (task: Task): TaskStatusType => {
    if (!task) return TaskStatus.PENDING;
    
    // If task is completed or archived, respect that status
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.ARCHIVED) {
      return task.status;
    }
    
    // If task is currently being timed, respect active/paused status
    const isCurrentlyTimed = timerState && timerState.taskId === task.id && timerState.status !== 'idle';
    
    // Get all sessions for this task
    const taskSessions = sessions.filter(session => session.task_id === task.id);
    const hasSessions = taskSessions.length > 0;
    
    // Use our utility function to determine the correct status
    return determineStatusFromSessions(task.status, hasSessions, isCurrentlyTimed);
  };

  // Initial data load
  useEffect(() => {
    fetchTask();
    
    // Check if user is an admin (greg@gjkandsons.com)
    const checkAdminStatus = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAdmin(data?.user?.email === 'greg@gjkandsons.com');
    };
    
    checkAdminStatus();
  }, [taskId]);

  // Initialize form data when task loads
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date,
        status: task.status,
        category: task.category,
        tags: task.tags || []
      });
    }
  }, [task]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Save edited task
  const handleSave = async () => {
    if (!task || !formData) return;
    
    try {
      const { error } = await taskService.updateTask(taskId!, {
        ...formData,
        tags: formData.tags || []
      });
      if (error) throw error;
      
      // Return to view mode
      navigate(`/tasks/${taskId}`);
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save task');
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    
    await updateTaskStatus(task.id, newStatus);
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/tasks/edit/${taskId}`);
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!task) return;
    
    const confirmed = window.confirm('Are you sure you want to permanently delete this task?');
    if (!confirmed) return;
    
    try {
      const result = await taskService.deleteTask(taskId!);
      
      if (!result.error) {
        setError(null);
        navigate('/');
      } else {
        setError(`Failed to delete task: ${result.error.message}`);
      }
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error('Task deletion error:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Error</h2>
          <p>{error || 'Task not found'}</p>
          <button 
            onClick={() => navigate('/Home')}
            className="mt-4 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Calculate status actions based on current status
  const getStatusActions = () => {
    switch (getCorrectedTaskStatus(task)) {
      case TaskStatus.PENDING:
        return [
          {
            label: 'Start',
            icon: <Clock className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.ACTIVE),
            className: 'bg-green-500 hover:bg-green-600 text-white'
          },
          {
            label: 'Complete',
            icon: <CheckCircle className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.COMPLETED),
            className: 'bg-blue-500 hover:bg-blue-600 text-white'
          }
        ];
      case TaskStatus.ACTIVE:
        return [
          {
            label: 'Complete',
            icon: <CheckCircle className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.COMPLETED),
            className: 'bg-blue-500 hover:bg-blue-600 text-white'
          }
        ];
      case TaskStatus.COMPLETED:
        return [
          {
            label: 'Reopen',
            icon: <Clock className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.PENDING),
            className: 'bg-indigo-500 hover:bg-indigo-600 text-white'
          },
          {
            label: 'Archive',
            icon: <Archive className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.ARCHIVED),
            className: 'bg-gray-500 hover:bg-gray-600 text-white'
          }
        ];
      default:
        return [];
    }
  };

  // Admin actions
  const getAdminActions = () => {
    if (!isAdmin) return null;
    
    return (
      <div className="mt-4">
        <button
          onClick={handleDeleteTask}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Task
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/Home')}
        className="flex items-center text-gray-600 hover:text-indigo-600 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        <span>Back to Home</span>
      </button>
      
      {isEditMode ? (
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Task</h1>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                <Save className="h-4 w-4 mr-1" />
                <span>Save</span>
              </button>
              <button
                onClick={() => navigate(`/tasks/${taskId}`)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
          
          <form className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority || 'medium'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || TaskStatus.PENDING}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={TaskStatus.PENDING}>Pending</option>
                <option value={TaskStatus.ACTIVE}>Active</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
                <option value={TaskStatus.ARCHIVED}>Archived</option>
              </select>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Task Header */}
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div>
              <div className="flex items-center">
                <h1 className={cn(
                  "text-2xl font-bold border-l-4 pl-3 py-1",
                  getPriorityBorderColor(task.priority)
                )}>
                  {task.title}
                </h1>
                
                {/* Status Badge */}
                <span className={cn(
                  "ml-4 px-2 py-1 text-xs font-medium rounded-full",
                  getCorrectedTaskStatus(task) === TaskStatus.ACTIVE && "bg-green-100 text-green-800",
                  getCorrectedTaskStatus(task) === TaskStatus.PENDING && "bg-gray-100 text-gray-800",
                  getCorrectedTaskStatus(task) === TaskStatus.COMPLETED && "bg-blue-100 text-blue-800",
                  getCorrectedTaskStatus(task) === TaskStatus.ARCHIVED && "bg-gray-100 text-gray-500"
                )}>
                  {getCorrectedTaskStatus(task).replace('_', ' ')}
                </span>
              </div>
              
              {/* Due date */}
              {task.due_date && (
                <div className={cn(
                  "mt-2 text-sm",
                  getDueDateStyling(task.due_date).className
                )}>
                  Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              {/* Status change actions */}
              <div className="flex space-x-2">
                {getStatusActions().map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={cn(
                      "flex items-center px-3 py-1.5 rounded-md text-sm",
                      action.className
                    )}
                    title={action.label}
                  >
                    {action.icon}
                    <span className="ml-1 hidden sm:inline">{action.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Edit button */}
              <button
                onClick={handleEdit}
                className="p-2 rounded-md hover:bg-gray-100"
                title="Edit Task"
              >
                <Edit className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Task Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Task Details */}
              <div className="bg-white rounded-lg border p-6 shadow-sm">
                <h2 className="text-lg font-medium mb-4">Details</h2>
                {task.description ? (
                  <div className="prose max-w-none">{task.description}</div>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}
                
                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Created and updated dates */}
                <div className="mt-6 text-xs text-gray-500 flex flex-col space-y-1">
                  <div>Created: {format(new Date(task.created_at), 'MMM d, yyyy h:mm a')}</div>
                  {task.updated_at && (
                    <div>Updated: {format(new Date(task.updated_at), 'MMM d, yyyy h:mm a')}</div>
                  )}
                </div>
              </div>

              {/* Time Sessions */}
              <TaskSessions task={task} />
            </div>
            
            <div className="space-y-6">
              {/* Timer Controls */}
              {getCorrectedTaskStatus(task) !== TaskStatus.COMPLETED && getCorrectedTaskStatus(task) !== TaskStatus.ARCHIVED && (
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                  <h2 className="text-lg font-medium mb-4">Timer</h2>
                  <TimerControls taskId={task.id} />
                </div>
              )}
              
              {/* Category and Priority */}
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h2 className="text-lg font-medium mb-4">Properties</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                    <div className={cn(
                      "mt-1 font-medium",
                      task.priority === 'high' && "text-red-600",
                      task.priority === 'medium' && "text-amber-600", 
                      task.priority === 'low' && "text-green-600"
                    )}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Category</h3>
                    <div className="mt-1 font-medium">
                      {task.category_name || 'Uncategorized'}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">List</h3>
                    <div className="mt-1 font-medium">
                      {task.list_id ? 'List Name' : 'No List'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Related Tasks - placeholder for future feature */}
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h2 className="text-lg font-medium mb-4">Related Tasks</h2>
                <p className="text-gray-500 text-sm">No related tasks found.</p>
              </div>
            </div>
          </div>
          
          {/* Admin Actions */}
          {getAdminActions()}
        </>
      )}
    </div>
  );
}
