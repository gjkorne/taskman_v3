import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  addDays,
  subDays,
  parseISO,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar, Info } from 'lucide-react';
import { useTaskData } from '../../contexts/task/TaskDataContext';
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
  const formattedHour =
    hour === 0
      ? '12 AM'
      : hour < 12
      ? `${hour} AM`
      : hour === 12
      ? '12 PM'
      : `${hour - 12} PM`;

  // Filter sessions that fall within this hour
  const hourStart = new Date();
  hourStart.setHours(hour, 0, 0, 0);

  const hourEnd = new Date();
  hourEnd.setHours(hour, 59, 59, 999);

  const sessionsInSlot = sessions.filter((session) => {
    const start = parseISO(session.start_time);
    const end = session.end_time ? parseISO(session.end_time) : new Date();

    return (
      (start >= hourStart && start <= hourEnd) || // Session starts in this hour
      (end >= hourStart && end <= hourEnd) || // Session ends in this hour
      (start <= hourStart && end >= hourEnd) // Session spans this entire hour
    );
  });

  return (
    <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] border-b border-gray-200">
      <div className="py-1 sm:py-2 pr-2 sm:pr-4 text-right text-xs sm:text-sm text-gray-500 font-medium sticky left-0 bg-gray-50 flex items-center justify-end">
        {formattedHour}
      </div>

      <div className="relative min-h-[45px] sm:min-h-[60px] border-l border-gray-200">
        {sessionsInSlot.length === 0 ? (
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-gray-200"></div>
          </div>
        ) : (
          sessionsInSlot.map((session) => {
            const start = parseISO(session.start_time);
            const end = session.end_time
              ? parseISO(session.end_time)
              : new Date();
            const task = tasks[session.task_id];

            if (!task) return null;

            // Calculate position and height
            const startMinute =
              start.getHours() === hour ? start.getMinutes() : 0;
            const endMinute = end.getHours() === hour ? end.getMinutes() : 59;

            const top = (startMinute / 60) * 100;
            const height = ((endMinute - startMinute) / 60) * 100;

            // Get duration in minutes for display
            const durationMinutes = differenceInMinutes(end, start);
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            const durationText =
              hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            // Determine color based on task priority
            const priorityColors = {
              urgent: 'bg-red-100 border-red-300 text-red-800',
              high: 'bg-orange-100 border-orange-300 text-orange-800',
              medium: 'bg-blue-100 border-blue-300 text-blue-800',
              low: 'bg-green-100 border-green-300 text-green-800',
            };

            const color =
              priorityColors[task.priority as keyof typeof priorityColors] ||
              'bg-gray-100 border-gray-300 text-gray-800';

            return (
              <div
                key={session.id}
                className={`absolute left-0 right-1 sm:right-2 px-1 sm:px-2 py-1 border rounded text-xs ${color} shadow-sm touch-manipulation`}
                style={{
                  top: `${top}%`,
                  height: `${Math.max(height, 10)}%`,
                  overflow: 'hidden',
                }}
                title={`${task.title} (${durationText})`}
              >
                <div className="font-medium truncate text-[10px] sm:text-xs">
                  {task.title}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs truncate">
                    {durationText}
                  </span>
                </div>
              </div>
            );
          })
        )}
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
  const [activeTimeRange, setActiveTimeRange] = useState<
    'all' | 'business' | 'evening'
  >('all');

  // Update selected date when the date prop changes
  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  // Get tasks from context
  const { tasks } = useTaskData();

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
          const taskSessions = await timeSessionsService.getSessionsByTaskId(
            taskId
          );
          allSessions = [...allSessions, ...taskSessions];
        }

        // Filter sessions that fall within the selected day
        const sessionsForDay = allSessions.filter((session: TimeSession) => {
          const sessionStart = parseISO(session.start_time);
          const sessionEnd = session.end_time
            ? parseISO(session.end_time)
            : new Date();

          return (
            isWithinInterval(sessionStart, { start: dayStart, end: dayEnd }) ||
            isWithinInterval(sessionEnd, { start: dayStart, end: dayEnd }) ||
            (sessionStart <= dayStart && sessionEnd >= dayEnd)
          );
        });

        setSessions(sessionsForDay);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to load time sessions')
        );
        console.error('Error fetching time sessions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [selectedDate, tasksById]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate((prevDate) => subDays(prevDate, 1));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate((prevDate) => addDays(prevDate, 1));
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Set of hours to display based on the active time range
  const getHoursToDisplay = () => {
    switch (activeTimeRange) {
      case 'business':
        return Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 6 PM
      case 'evening':
        return Array.from({ length: 8 }, (_, i) => i + 17); // 5 PM to 12 AM
      case 'all':
      default:
        return Array.from({ length: 24 }, (_, i) => i); // All 24 hours
    }
  };

  // Get day stats - number of sessions and total time
  const getDayStats = () => {
    if (sessions.length === 0) return { count: 0, totalMinutes: 0 };

    const totalMinutes = sessions.reduce((total, session) => {
      if (!session.end_time) return total;
      const start = parseISO(session.start_time);
      const end = parseISO(session.end_time);
      return total + differenceInMinutes(end, start);
    }, 0);

    return {
      count: sessions.length,
      totalMinutes,
    };
  };

  const { count, totalMinutes } = getDayStats();
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Render header with day navigation and stats
  const renderHeader = () => {
    const isSelectedDateToday = isToday(selectedDate);

    return (
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-800 flex items-center">
            <span
              className={`flex-shrink-0 ${
                isSelectedDateToday ? 'text-blue-600' : ''
              }`}
            >
              {format(selectedDate, 'EEE, MMM d')}
            </span>
            <span className="hidden sm:inline text-gray-600 ml-1">
              {format(selectedDate, 'yyyy')}
            </span>
            {isSelectedDateToday && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </h2>
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={goToPreviousDay}
              className="p-1 sm:p-2 border border-gray-300 rounded-md hover:bg-gray-100 touch-manipulation"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-xs sm:text-sm touch-manipulation"
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className="p-1 sm:p-2 border border-gray-300 rounded-md hover:bg-gray-100 touch-manipulation"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        {!isLoading && sessions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Info className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Day Summary</span>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 underline text-xs touch-manipulation"
              >
                Add task
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white rounded p-2 shadow-sm">
                <div className="text-[10px] sm:text-xs text-gray-500">
                  Sessions
                </div>
                <div className="font-semibold">{count} sessions</div>
              </div>
              <div className="bg-white rounded p-2 shadow-sm">
                <div className="text-[10px] sm:text-xs text-gray-500">
                  Total Time
                </div>
                <div className="font-semibold">
                  {totalHours > 0
                    ? `${totalHours}h ${remainingMinutes}m`
                    : `${remainingMinutes}m`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time range filter */}
        <div className="flex space-x-1 text-xs sm:text-sm overflow-x-auto py-1 scrollbar-hide">
          <button
            onClick={() => setActiveTimeRange('all')}
            className={`flex-shrink-0 px-3 py-1 rounded-full touch-manipulation ${
              activeTimeRange === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All hours
          </button>
          <button
            onClick={() => setActiveTimeRange('business')}
            className={`flex-shrink-0 px-3 py-1 rounded-full touch-manipulation ${
              activeTimeRange === 'business'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Business (8AM-6PM)
          </button>
          <button
            onClick={() => setActiveTimeRange('evening')}
            className={`flex-shrink-0 px-3 py-1 rounded-full touch-manipulation ${
              activeTimeRange === 'evening'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Evening (5PM-12AM)
          </button>
        </div>
      </div>
    );
  };

  const hours = getHoursToDisplay();

  return (
    <div className="max-w-full mx-auto">
      <div>
        {renderHeader()}

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading time sessions...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <p className="mb-2">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 touch-manipulation"
            >
              Reload
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">
              No time sessions recorded for this day.
            </p>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 touch-manipulation"
            >
              Create a task
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0 bg-white rounded-lg border border-gray-200">
            <div className="min-w-[300px] sm:min-w-full px-2 sm:px-0">
              {hours.map((hour) => (
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
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}

export default DailyView;
