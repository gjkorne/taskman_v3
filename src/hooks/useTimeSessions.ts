import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeSession, timeSessionsService } from '../services/api/timeSessionsService';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { 
  formatDuration, 
  calculateTotalDuration, 
  formatTimeForDisplay, 
  calculateActiveSessionDuration,
  formatSecondsToTime 
} from '../utils/timeUtils';

/**
 * Custom hook for managing time sessions
 */
export function useTimeSessions(taskId?: string) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalTime, setTotalTime] = useState('00:00:00');
  
  // Add a ref for tracking active sessions that need updating
  const activeSessions = useRef<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Format the start and end time of a session
  const formatSessionTime = (session: TimeSession) => {
    const start = parseISO(session.start_time);
    const formattedStart = formatTimeForDisplay(session.start_time);
    
    // If it's an active session (no end time)
    if (!session.end_time) {
      // Store active session ID for periodic refreshing
      if (!activeSessions.current.includes(session.id)) {
        activeSessions.current.push(session.id);
      }
      
      const activeDuration = calculateActiveSessionDuration(session.start_time);
      
      return {
        start: formattedStart,
        end: 'In progress',
        duration: activeDuration,
        relative: formatDistanceToNow(start, { addSuffix: true })
      };
    }
    
    const formattedEnd = formatTimeForDisplay(session.end_time);
    
    // Use the improved formatDuration that can fallback to calculating based on timestamps
    // This handles cases where the database duration is missing or incorrect
    const displayDuration = formatDuration(session.duration, session.start_time, session.end_time);
    
    return {
      start: formattedStart,
      end: formattedEnd,
      duration: displayDuration,
      relative: formatDistanceToNow(start, { addSuffix: true })
    };
  };

  // Calculate the total time spent on sessions
  const calculateTotalTime = useCallback((sessions: TimeSession[]) => {
    // Calculate duration for completed sessions
    const completedSessions = sessions.filter(session => session.end_time);
    let totalFromCompleted = calculateTotalDuration(completedSessions);
    
    // Calculate and add duration for active sessions
    const activeSessions = sessions.filter(session => !session.end_time);
    let activeDurationSeconds = 0;
    
    activeSessions.forEach(session => {
      if (session.start_time) {
        try {
          const start = parseISO(session.start_time);
          const now = new Date();
          // Only add if the start time is valid and in the past
          if (!isNaN(start.getTime()) && start <= now) {
            const seconds = Math.max(0, (now.getTime() - start.getTime()) / 1000);
            activeDurationSeconds += seconds;
          }
        } catch (error) {
          console.error('Error calculating active session duration:', error);
        }
      }
    });
    
    // If there are active sessions, we need to add their durations to the total
    if (activeDurationSeconds > 0) {
      const totalSeconds = 
        parseInt(totalFromCompleted.split(':')[0], 10) * 3600 + 
        parseInt(totalFromCompleted.split(':')[1], 10) * 60 + 
        parseInt(totalFromCompleted.split(':')[2], 10) + 
        activeDurationSeconds;
      
      return formatSecondsToTime(totalSeconds);
    }
    
    return totalFromCompleted;
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
      
      // Reset active sessions list
      activeSessions.current = data
        .filter(session => !session.end_time)
        .map(session => session.id);
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

  // Set up a periodic refresh for active sessions
  useEffect(() => {
    // Only set up timer if we have active sessions
    if (activeSessions.current.length === 0) return;
    
    // Update every second for active sessions
    const timer = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sessions]);
  
  // Recalculate total time when refresh trigger changes
  useEffect(() => {
    if (activeSessions.current.length > 0) {
      setTotalTime(calculateTotalTime(sessions));
    }
  }, [refreshTrigger, calculateTotalTime, sessions]);

  return {
    sessions,
    isLoading,
    error,
    totalTime,
    formatSessionTime,
    deleteSession
  };
}
