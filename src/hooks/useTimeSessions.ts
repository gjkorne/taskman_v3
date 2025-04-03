import { useState, useEffect, useCallback } from 'react';
import { TimeSession, timeSessionsService } from '../services/api/timeSessionsService';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { formatDuration, calculateTotalDuration } from '../utils/timeUtils';

/**
 * Custom hook for managing time sessions
 */
export function useTimeSessions(taskId?: string) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalTime, setTotalTime] = useState('00:00:00');

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

  // Calculate the total time spent on sessions
  const calculateTotalTime = useCallback((sessions: TimeSession[]) => {
    return calculateTotalDuration(sessions);
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
      console.log('Attempting to delete session:', sessionId);
      
      // First get the session to check if it's active
      const currentSessions = [...sessions];
      const sessionToDelete = currentSessions.find(s => s.id === sessionId);
      
      if (!sessionToDelete) {
        console.error('Session not found for deletion:', sessionId);
        throw new Error('Session not found');
      }
      
      console.log('Session to delete:', sessionToDelete);
      
      // Delete the session from the database
      const success = await timeSessionsService.deleteSession(sessionId);
      
      if (success) {
        console.log('Session successfully deleted from database');
        
        // Immediately update the local state to remove the session
        setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
        
        // Then refresh from server
        if (taskId) {
          fetchTaskSessions();
        } else {
          fetchUserSessions();
        }
        
        return true;
      } else {
        throw new Error('Failed to delete session');
      }
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
