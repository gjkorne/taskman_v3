import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, parseISO, differenceInMinutes, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTaskContext } from '../../contexts/TaskContext';
import { TimeSession } from '../../services/api/timeSessionsService';
import { timeSessionsService } from '../../services/api/timeSessionsService';
import { TaskFormModal } from '../TaskForm/TaskFormModal';
import { Task } from '../../types/task';

interface TimeSlotProps {
  hour: number;
  sessions: TimeSession[];
  tasks: Record<string, Task>;
}

/**
 * TimeSlot component
 * Represents a single hour in the daily timeline with any sessions during that hour
 */
const TimeSlot: React.FC<TimeSlotProps> = ({ hour, sessions, tasks }) => {
  const formattedHour = hour < 10 ? `0${hour}:00` : `${hour}:00`;
  
  // Filter sessions that fall within this hour
  const hourStart = new Date();
  hourStart.setHours(hour, 0, 0, 0);
  
  const hourEnd = new Date();
  hourEnd.setHours(hour, 59, 59, 999);
  
  const sessionsInSlot = sessions.filter(session => {
    const start = parseISO(session.start_time);
    const end = session.end_time ? parseISO(session.end_time) : new Date();
    
    return (
      (start >= hourStart && start <= hourEnd) || // Session starts in this hour
      (end >= hourStart && end <= hourEnd) || // Session ends in this hour
      (start <= hourStart && end >= hourEnd) // Session spans this entire hour
    );
  });
  
  return (
    <div className="grid grid-cols-[80px_1fr] border-b border-gray-200">
      <div className="py-2 pr-4 text-right text-sm text-gray-500 font-medium sticky left-0 bg-gray-50">
        {formattedHour}
      </div>
      <div className="min-h-[60px] relative border-l border-gray-200 py-1">
        {sessionsInSlot.map(session => {
          const start = parseISO(session.start_time);
          const end = session.end_time ? parseISO(session.end_time) : new Date();
          const task = tasks[session.task_id];
          
          if (!task) return null;
          
          // Calculate position and height
          const startMinute = (start.getHours() === hour) ? start.getMinutes() : 0;
          const endMinute = (end.getHours() === hour) ? end.getMinutes() : 59;
          
          const top = (startMinute / 60) * 100;
          const height = ((endMinute - startMinute) / 60) * 100;
          
          // Get duration in minutes for display
          const durationMinutes = differenceInMinutes(end, start);
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          const durationText = hours > 0 
            ? `${hours}h ${minutes}m` 
            : `${minutes}m`;
          
          // Determine color based on task priority
          const priorityColors = {
            urgent: 'bg-red-100 border-red-300 text-red-800',
            high: 'bg-orange-100 border-orange-300 text-orange-800',
            medium: 'bg-blue-100 border-blue-300 text-blue-800',
            low: 'bg-green-100 border-green-300 text-green-800'
          };
          
          const color = priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-100 border-gray-300 text-gray-800';
          
          return (
            <div 
              key={session.id}
              className={`absolute left-0 right-2 px-2 py-1 border rounded text-xs ${color}`}
              style={{ 
                top: `${top}%`, 
                height: `${Math.max(height, 10)}%`,
                overflow: 'hidden'
              }}
              title={`${task.title} (${durationText})`}
            >
              <div className="font-medium truncate">{task.title}</div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{durationText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DailyViewProps {
  date: Date;
}

/**
 * DailyView component
 * Shows a timeline of time sessions throughout a single day
 */
export function DailyView({ date }: DailyViewProps) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Update selected date when the date prop changes
  useEffect(() => {
    setSelectedDate(date);
  }, [date]);
  
  // Get tasks from context
  const { tasks } = useTaskContext();
  
  // Create a lookup map for tasks by ID for easier access
  const tasksById = useMemo(() => {
    return tasks.reduce((acc: Record<string, Task>, task: Task) => {
      acc[task.id] = task;
      return acc;
    }, {});
  }, [tasks]);
  
  // Load time sessions for the selected date
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the date range for the selected day (full 24 hours)
        const dayStart = startOfDay(selectedDate);
        const dayEnd = endOfDay(selectedDate);
        
        // Create array to collect all sessions
        let allSessions: TimeSession[] = [];
        
        // For a simple demo, we'll collect sessions for each task
        // In a real implementation, you would have an API endpoint to get all sessions with filters
        for (const taskId of Object.keys(tasksById)) {
          const taskSessions = await timeSessionsService.getSessionsByTaskId(taskId);
          allSessions = [...allSessions, ...taskSessions];
        }
        
        // Filter sessions that fall within the selected day
        const sessionsForDay = allSessions.filter((session: TimeSession) => {
          const sessionStart = parseISO(session.start_time);
          const sessionEnd = session.end_time ? parseISO(session.end_time) : new Date();
          
          return (
            isWithinInterval(sessionStart, { start: dayStart, end: dayEnd }) ||
            isWithinInterval(sessionEnd, { start: dayStart, end: dayEnd }) ||
            (sessionStart <= dayStart && sessionEnd >= dayEnd)
          );
        });
        
        setSessions(sessionsForDay);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load time sessions'));
        console.error('Error fetching time sessions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, [selectedDate, tasksById]);
  
  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };
  
  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };
  
  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Render header with day navigation
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-sm"
          >
            Today
          </button>
          <button
            onClick={goToNextDay}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  };
  
  // Generate all hours of the day (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="max-w-full mx-auto">
      <div>
        {renderHeader()}
        
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading time sessions...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            Error: {error.message}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No time sessions recorded for this day.
            <div className="mt-2">
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="text-blue-600 hover:underline"
              >
                Create a task
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {hours.map(hour => (
                <TimeSlot 
                  key={hour} 
                  hour={hour} 
                  sessions={sessions} 
                  tasks={tasksById} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskCreated={() => setIsTaskModalOpen(false)}
          title="Add Task"
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}

export default DailyView;
