import { useQuery } from '@tanstack/react-query';
import { DashboardWidget } from './DashboardWidget';
import { Clock, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { useTaskData } from '../../contexts/task';
import { useTimeSessionData } from '../../contexts/timeSession';
import { formatDistanceToNow, isValid } from 'date-fns';
import { TASK_QUERY_KEYS } from '../../contexts/task/TaskDataContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TaskStatus, TaskStatusType, Task } from '../../types/task';
import { useTimer } from '../../contexts/TimerCompat';
import { determineStatusFromSessions } from '../../utils/taskStatusUtils';

interface RecentTasksWidgetProps {
  title?: string;
  limit?: number;
}

/**
 * RecentTasksWidget - Shows the most recently worked on tasks based on sessions
 * Uses React Query optimized task data and time session data
 */
export function RecentTasksWidget({ title = "Recently Worked Tasks", limit = 5 }: RecentTasksWidgetProps) {
  const { tasks, isLoading: tasksLoading, refreshTasks } = useTaskData();
  const { sessions } = useTimeSessionData();
  const timer = useTimer();
  const timerState = timer.timerState;
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Ensure tasks are loaded when the component mounts
  useEffect(() => {
    if (tasks.length === 0 && !tasksLoading) {
      console.log('[RecentTasksWidget] No tasks found, refreshing...');
      refreshTasks();
    }
  }, [tasks, tasksLoading, refreshTasks]);
  
  // Log task and session data directly to check what we're working with
  useEffect(() => {
    console.log('[RecentTasksWidget] Tasks:', tasks);
    console.log('[RecentTasksWidget] Sessions:', sessions);
    console.log('[RecentTasksWidget] Timer state:', timerState);
  }, [tasks, sessions, timerState]);
  
  // Toggle show completed tasks
  const handleToggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  // Use React Query for recent tasks
  const { data: recentTasks, isLoading } = useQuery({
    queryKey: [...TASK_QUERY_KEYS.metrics(), 'recent-tasks', showCompleted],
    queryFn: () => getRecentlyWorkedTasks(tasks, sessions, limit, showCompleted),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    enabled: tasks.length > 0 && sessions.length > 0,
  });
  
  // Format time for display with relative times
  const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'No recent activity';
    
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return 'Invalid date';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'No recent activity';
    }
  };
  
  // Get status badge styling based on task status
  const getStatusBadge = (status: string, taskId: string) => {
    // Use corrected status if needed
    const correctedStatus = getCorrectedTaskStatus(status, taskId);
    
    const statusMap: Record<string, { color: string, text: string }> = {
      [TaskStatus.PENDING]: { color: 'bg-gray-100 text-gray-800', text: 'Pending' },
      [TaskStatus.ACTIVE]: { color: 'bg-blue-100 text-blue-800', text: 'Active' },
      [TaskStatus.PAUSED]: { color: 'bg-yellow-100 text-yellow-800', text: 'Paused' },
      [TaskStatus.COMPLETED]: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      [TaskStatus.ARCHIVED]: { color: 'bg-gray-100 text-gray-500', text: 'Archived' }
    };
    
    const badgeStyle = statusMap[correctedStatus] || { color: 'bg-gray-100 text-gray-800', text: correctedStatus };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${badgeStyle.color}`}>
        {badgeStyle.text}
      </span>
    );
  };
  
  // Get corrected task status based on sessions and timer state
  const getCorrectedTaskStatus = (currentStatus: string, taskId: string): TaskStatusType => {
    // If task is completed or archived, respect that status
    if (currentStatus === TaskStatus.COMPLETED || currentStatus === TaskStatus.ARCHIVED) {
      return currentStatus as TaskStatusType;
    }
    
    // If task is currently being timed, respect active/paused status
    const isCurrentlyTimed = timerState && timerState.taskId === taskId && timerState.status !== 'idle';
    
    // Get all sessions for this task
    const taskSessions = sessions.filter(session => session.task_id === taskId);
    const hasSessions = taskSessions.length > 0;
    
    // Use our utility function to determine the correct status
    return determineStatusFromSessions(currentStatus as TaskStatusType, hasSessions, isCurrentlyTimed);
  };
  
  /**
   * Handle starting a timer - explicitly preventing event bubbling
   */
  const handleStartTimer = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[RecentTasksWidget] Starting timer for task:', taskId);
    timer.startTimer(taskId);
  };
  
  /**
   * Handle pausing a timer - explicitly preventing event bubbling
   */
  const handlePauseTimer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[RecentTasksWidget] Pausing timer');
    timer.pauseTimer();
  };
  
  /**
   * Handle resuming a timer - explicitly preventing event bubbling
   */
  const handleResumeTimer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[RecentTasksWidget] Resuming timer');
    timer.resumeTimer();
  };
  
  /**
   * Handle completing a task - explicitly preventing event bubbling
   */
  const handleCompleteTask = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[RecentTasksWidget] Completing task:', taskId);
    timer.completeTask(taskId);
  };
  
  const combinedLoading = isLoading || tasksLoading;
  
  return (
    <DashboardWidget
      title={title}
      isLoading={combinedLoading}
      className="col-span-1 md:col-span-2"
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
        <Link to="/tasks" className="text-taskman-blue-600 text-sm hover:underline flex items-center">
          View all tasks <span className="ml-1">→</span>
        </Link>
      }
    >
      <div className="space-y-1">
        {(!recentTasks || recentTasks.length === 0) && !combinedLoading && (
          <div className="text-center py-3 text-gray-500 text-sm flex flex-col items-center justify-center">
            <AlertCircle className="h-5 w-5 mb-1 text-yellow-500" />
            <p>No recently worked tasks found</p>
            <p className="text-xs mt-1">Start a timer session to track your work</p>
          </div>
        )}
        
        {recentTasks && recentTasks.map((task) => (
          <Link 
            key={task.id}
            to={`/tasks/${task.id}`}
            className="block hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="mr-2 flex-shrink-0">
              {task.status === TaskStatus.COMPLETED ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-taskman-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                {getStatusBadge(task.status, task.id)}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-2">Last worked: {formatTime(task.lastSessionDate)}</span>
                {task.category_name && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100">
                    {task.category_name}
                  </span>
                )}
              </div>
              <div className="flex mt-1 space-x-2">
                {task.status !== TaskStatus.COMPLETED && (
                  <button 
                    onClick={(e) => handleCompleteTask(e, task.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Complete
                  </button>
                )}
                {timerState?.taskId !== task.id && task.status !== TaskStatus.COMPLETED && (
                  <button 
                    onClick={(e) => handleStartTimer(e, task.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Start Timer
                  </button>
                )}
                {timerState?.taskId === task.id && timerState?.status === 'running' && (
                  <button 
                    onClick={handlePauseTimer}
                    className="text-xs text-yellow-600 hover:text-yellow-800"
                  >
                    Pause Timer
                  </button>
                )}
                {timerState?.taskId === task.id && timerState?.status === 'paused' && (
                  <button 
                    onClick={handleResumeTimer}
                    className="text-xs text-green-600 hover:text-green-800"
                  >
                    Resume Timer
                  </button>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardWidget>
  );
}

// Function to get the most recently worked on tasks based on session data
function getRecentlyWorkedTasks(tasks: Task[] = [], sessions: any[] = [], limit = 5, showCompleted = false) {
  if (!tasks.length || !sessions.length) {
    return [];
  }
  
  try {
    // Map to track the most recent session date for each task
    const taskLastSessionMap = new Map<string, string>();
    
    // Process all sessions to find the most recent for each task
    sessions.forEach(session => {
      const taskId = session.task_id;
      const sessionDate = session.end_time || session.start_time;
      
      if (!taskLastSessionMap.has(taskId) || 
          new Date(sessionDate) > new Date(taskLastSessionMap.get(taskId)!)) {
        taskLastSessionMap.set(taskId, sessionDate);
      }
    });
    
    // Create a list of tasks with their last session date
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
    
    // Return limited number of tasks
    return sortedTasks.slice(0, limit);
  } catch (error) {
    console.error('Error in getRecentlyWorkedTasks:', error);
    return [];
  }
}

export default RecentTasksWidget;
