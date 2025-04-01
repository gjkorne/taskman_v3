import { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTimer } from '../../contexts/TimerContext';
import { Task } from '../../types/task';
import { TimerControls } from './TimerControls';

export function Timer() {
  const { timerState, formatElapsedTime } = useTimer();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the active task and recent tasks when component mounts or timer state changes
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        if (timerState.taskId) {
          // Fetch the currently active task
          const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', timerState.taskId)
            .single();
          
          if (taskError) throw taskError;
          setActiveTask(taskData);
        } else {
          setActiveTask(null);
        }

        // Fetch recent tasks for quick access (not completed, sorted by recently updated)
        const { data: recentData, error: recentError } = await supabase
          .from('tasks')
          .select('*')
          .neq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(5);
        
        if (recentError) throw recentError;
        setRecentTasks(recentData || []);
      } catch (error) {
        console.error('Error fetching timer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [timerState.taskId, timerState.status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Time Tracking</h1>
        <p className="text-gray-600">Track time spent on your tasks to improve productivity.</p>
      </div>

      {/* Active Timer Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <Clock className="mr-2" size={20} />
          Current Timer
        </h2>
        
        {activeTask ? (
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-lg">{activeTask.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{activeTask.description}</p>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {formatElapsedTime('short')} elapsed
              </div>
            </div>
            
            <div className="mt-4">
              <TimerControls taskId={activeTask.id} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-gray-500 mb-4">No active timer running</div>
            <p className="text-sm text-gray-600 mb-4">Start a timer from the task list or select a task below</p>
          </div>
        )}
      </div>

      {/* Recent Tasks Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Tasks</h2>
        
        {recentTasks.length > 0 ? (
          <div className="grid gap-4">
            {recentTasks
              .filter(task => task.id !== activeTask?.id) // Don't show active task again
              .map(task => (
                <div key={task.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <div className="text-xs text-gray-500">
                      {task.status === 'active' ? (
                        <span className="flex items-center text-emerald-600">
                          <Play size={12} className="mr-1" /> In progress
                        </span>
                      ) : (
                        <span className="flex items-center text-blue-600">
                          <CheckCircle size={12} className="mr-1" /> Ready
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <TimerControls taskId={task.id} compact={true} />
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">No tasks available</div>
        )}
      </div>
    </div>
  );
}
