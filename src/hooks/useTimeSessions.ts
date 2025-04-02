import { useState, useEffect, useCallback } from 'react';
import { TimeSession, timeSessionsService } from '../services/api/timeSessionsService';
import { formatDistanceToNow, format, parseISO, intervalToDuration } from 'date-fns';

/**
 * Custom hook for managing time sessions
 */
export function useTimeSessions(taskId?: string) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalTime, setTotalTime] = useState('00:00:00');

  // Format the session duration from PostgreSQL interval string
  const formatDuration = (durationStr: string | null): string => {
    if (!durationStr) return '00:00:00';
    
    // Parse interval string (e.g., "3600 seconds")
    const parts = durationStr.split(' ');
    if (parts.length !== 2 || parts[1] !== 'seconds') return '00:00:00';
    
    const seconds = parseInt(parts[0], 10);
    if (isNaN(seconds)) return '00:00:00';
    
    // Convert to hours, minutes, seconds
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    
    return [
      String(duration.hours || 0).padStart(2, '0'),
      String(duration.minutes || 0).padStart(2, '0'),
      String(duration.seconds || 0).padStart(2, '0')
    ].join(':');
  };

  // Format the start and end time of a session
  const formatSessionTime = (session: TimeSession) => {
    const start = parseISO(session.start_time);
    const formattedStart = format(start, 'MMM d, yyyy h:mm a');
    
    if (!session.end_time) {
      return {
        start: formattedStart,
        end: 'In progress',
        duration: 'Active',
        relative: formatDistanceToNow(start, { addSuffix: true })
      };
    }
    
    const end = parseISO(session.end_time);
    const formattedEnd = format(end, 'MMM d, yyyy h:mm a');
    
    return {
      start: formattedStart,
      end: formattedEnd,
      duration: formatDuration(session.duration),
      relative: formatDistanceToNow(start, { addSuffix: true })
    };
  };

  // Calculate the total time spent on a task
  const calculateTotalTime = useCallback((sessions: TimeSession[]) => {
    let totalSeconds = 0;
    
    sessions.forEach(session => {
      if (session.duration) {
        const parts = session.duration.split(' ');
        if (parts.length === 2 && parts[1] === 'seconds') {
          const seconds = parseInt(parts[0], 10);
          if (!isNaN(seconds)) {
            totalSeconds += seconds;
          }
        }
      }
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // Fetch sessions for a specific task
  const fetchTaskSessions = useCallback(async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await timeSessionsService.getSessionsByTaskId(taskId);
      setSessions(data);
      setTotalTime(calculateTotalTime(data));
    } catch (err) {
      console.error('Error fetching task sessions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
    } finally {
      setIsLoading(false);
    }
  }, [taskId, calculateTotalTime]);

  // Fetch all user sessions
  const fetchUserSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await timeSessionsService.getUserSessions();
      setSessions(data as TimeSession[]);
    } catch (err) {
      console.error('Error fetching user sessions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    try {
      await timeSessionsService.deleteSession(sessionId);
      
      // Update the sessions list after deletion
      if (taskId) {
        fetchTaskSessions();
      } else {
        fetchUserSessions();
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete session'));
      return false;
    }
  };

  // Initial data load
  useEffect(() => {
    if (taskId) {
      fetchTaskSessions();
    } else {
      fetchUserSessions();
    }
  }, [taskId, fetchTaskSessions, fetchUserSessions]);

  return {
    sessions,
    isLoading,
    error,
    formatSessionTime,
    totalTime,
    refreshSessions: taskId ? fetchTaskSessions : fetchUserSessions,
    deleteSession
  };
}
