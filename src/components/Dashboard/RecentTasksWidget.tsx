import { useQuery } from '@tanstack/react-query';
import { DashboardWidget } from './DashboardWidget';
import { AlertCircle, Filter, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskData } from '../../contexts/task';
import { useTimeSessionData } from '../../contexts/timeSession';
import { Link } from 'react-router-dom';
import { Task, TaskStatus } from '../../types/task';
import { useState } from 'react';

interface RecentTasksWidgetProps {
  title?: string;
  limit?: number;
}

/**
 * Get the CSS class for a task category
 */
function getCategoryColorClass(category?: string) {
  switch (category?.toLowerCase()) {
    case 'work':
      return 'text-blue-700';
    case 'personal':
      return 'text-amber-700';
    case 'childcare':
      return 'text-green-700';
    default:
      return 'text-gray-700';
  }
}

/**
 * RecentTasksWidget - Shows the most recently worked on tasks based on sessions
 * Uses React Query optimized task data and time session data
 */
export function RecentTasksWidget({ title = "Recently Worked Tasks", limit = 9 }: RecentTasksWidgetProps) {
  const { tasks, isLoading: tasksLoading, refreshTasks } = useTaskData();
  const { sessions } = useTimeSessionData();
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5; // Number of tasks to show per page
  
  // Get recently worked tasks
  const { data: allRecentTasks, isLoading: recentTasksLoading } = useQuery({
    queryKey: ['recentTasks', tasks, sessions, limit, showCompleted],
    queryFn: () => getRecentlyWorkedTasks(tasks, sessions, limit, showCompleted),
    enabled: !!tasks && !!sessions,
  });
  
  const combinedLoading = tasksLoading || recentTasksLoading;
  
  // Calculate pagination
  const totalTasks = allRecentTasks?.length || 0;
  const totalPages = Math.ceil(totalTasks / tasksPerPage);
  
  // Get current page of tasks
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = allRecentTasks?.slice(indexOfFirstTask, indexOfLastTask) || [];
  
  // Handle page changes
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Handle toggling show completed tasks
  const handleToggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  // Handle starting a task
  const handleStartTask = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the task
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;
    
    // Update the task status directly through the task service
    refreshTasks();
  };
  
  // Handle completing a task
  const handleCompleteTask = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the task
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;
    
    // Update the task status directly through the task service
    refreshTasks();
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Showing {indexOfFirstTask + 1}-{Math.min(indexOfLastTask, totalTasks)} of {totalTasks} tasks
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`p-1 rounded ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-600 px-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <DashboardWidget
      title={title}
      isLoading={combinedLoading}
      className="h-full flex flex-col"
      actions={
        <button 
          onClick={handleToggleShowCompleted}
          className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"
          title={showCompleted ? "Hide completed tasks" : "Show completed tasks"}
        >
          <Filter size={16} />
          <span className="ml-1 text-xs">{showCompleted ? "Hide Completed" : "Show Completed"}</span>
        </button>
      }
      footer={
        <div className="w-full">
          {renderPagination()}
          <Link to="/tasks" className="text-taskman-blue-600 text-sm hover:underline flex items-center mt-2">
            View all tasks <span className="ml-1">→</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-0.5 flex-grow">
        {(!allRecentTasks || allRecentTasks.length === 0) && !combinedLoading && (
          <div className="text-center py-3 text-gray-500 text-sm flex flex-col items-center justify-center">
            <AlertCircle className="h-5 w-5 mb-1 text-yellow-500" />
            <p>No recently worked tasks found</p>
            <p className="text-xs mt-1">Start a timer session to track your work</p>
          </div>
        )}
        
        {currentTasks && currentTasks.map((task) => (
          <Link 
            key={task.id}
            to={`/tasks/${task.id}`}
            className="block hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between py-2 px-3 rounded-md"
          >
            <div className="flex items-center">
              <div className="mr-3 flex-shrink-0">
                {task.status === TaskStatus.COMPLETED ? (
                  <CheckSquare className="h-5 w-5 text-green-500" />
                ) : task.status === TaskStatus.ACTIVE ? (
                  <Square className="h-5 w-5 text-blue-500" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <span className={`font-medium ${getCategoryColorClass(task.category)}`}>
                  {task.title}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-1">
              <button 
                onClick={(e) => handleStartTask(e, task.id)}
                className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition-colors"
              >
                Start
              </button>
              
              <button
                onClick={(e) => handleCompleteTask(e, task.id)}
                className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-md transition-colors"
              >
                Complete
              </button>
            </div>
          </Link>
        ))}
      </div>
    </DashboardWidget>
  );
}

// Function to get the most recently worked on tasks based on session data
function getRecentlyWorkedTasks(tasks: Task[] = [], sessions: any[] = [], limit = 9, showCompleted = false) {
  if (!tasks.length || !sessions.length) {
    return [];
  }
  
  try {
    // Create a map of task IDs to their last session date
    const taskLastSessionMap = new Map();
    
    // Process sessions to find the most recent session for each task
    sessions.forEach(session => {
      if (!session.task_id) return;
      
      const currentLastDate = taskLastSessionMap.get(session.task_id);
      const sessionDate = session.end_time || session.start_time;
      
      if (!currentLastDate || new Date(sessionDate) > new Date(currentLastDate)) {
        taskLastSessionMap.set(session.task_id, sessionDate);
      }
    });
    
    // Filter tasks that have sessions and match visibility settings
    const tasksWithLastSession = tasks
      .filter(task => {
        // Filter based on task visibility settings
        if (!showCompleted && task.status === TaskStatus.COMPLETED) {
          return false;
        }
        return taskLastSessionMap.has(task.id);
      })
      .map(task => ({
        ...task,
        lastSessionDate: taskLastSessionMap.get(task.id)
      }));
    
    // Sort by most recent session
    const sortedTasks = tasksWithLastSession.sort((a, b) => {
      return new Date(b.lastSessionDate as string).getTime() - new Date(a.lastSessionDate as string).getTime();
    });
    
    // Return tasks up to the limit
    return sortedTasks.slice(0, limit);
  } catch (error) {
    console.error('Error in getRecentlyWorkedTasks:', error);
    return [];
  }
}

export default RecentTasksWidget;
