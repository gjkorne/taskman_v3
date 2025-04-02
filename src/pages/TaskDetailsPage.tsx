import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, Clock, CheckCircle } from 'lucide-react';
import { taskService } from '../services/api/taskService';
import { Task, TaskStatus } from '../types/task';
import { TaskSessions } from '../components/TimeSessions/TaskSessions';
import { TimerControls } from '../components/Timer/TimerControls';
import { useTaskActions } from '../hooks/useTaskActions';
import { getPriorityBorderColor, getDueDateStyling } from '../lib/taskUtils';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // Initial data load
  useEffect(() => {
    fetchTask();
  }, [taskId]);

  // Handle status change
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    
    await updateTaskStatus(task.id, newStatus);
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/tasks/edit/${taskId}`);
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
            onClick={() => navigate('/tasks')}
            className="mt-4 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  // Calculate status actions based on current status
  const getStatusActions = () => {
    switch (task.status) {
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
      case TaskStatus.IN_PROGRESS:
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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/tasks')}
        className="flex items-center text-gray-600 hover:text-indigo-600 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        <span>Back to Tasks</span>
      </button>
      
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
              task.status === TaskStatus.ACTIVE && "bg-green-100 text-green-800",
              task.status === TaskStatus.IN_PROGRESS && "bg-indigo-100 text-indigo-800",
              task.status === TaskStatus.PENDING && "bg-gray-100 text-gray-800",
              task.status === TaskStatus.COMPLETED && "bg-blue-100 text-blue-800",
              task.status === TaskStatus.ARCHIVED && "bg-gray-100 text-gray-500"
            )}>
              {task.status.replace('_', ' ')}
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
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
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
          {task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.ARCHIVED && (
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
    </div>
  );
}
