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
  // 1. All useState hooks
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalTime, setTotalTime] = useState('00:00:00');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // 2. All useRef hooks
  const activeSessions = useRef<string[]>([]);
  
  // 3. All useCallback hooks in the original order
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

  const refreshSessions = useCallback(() => {
    if (taskId) {
      fetchTaskSessions();
    } else {
      fetchUserSessions();
    }
  }, [taskId, fetchTaskSessions, fetchUserSessions]);

  // 4. All useEffect hooks
  useEffect(() => {
    if (taskId) {
      fetchTaskSessions();
    } else {
      fetchUserSessions();
    }
  }, [taskId, fetchTaskSessions, fetchUserSessions]);

  useEffect(() => {
    // Only set up timer if we have active sessions
    if (activeSessions.current.length === 0) return;
    
    // Update every second for active sessions
    const timer = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeSessions.current.length]);

  useEffect(() => {
    if (activeSessions.current.length > 0) {
      setTotalTime(calculateTotalTime(sessions));
    }
  }, [refreshTrigger, calculateTotalTime, sessions]);

  // Format the start and end time of a session (not a hook, so it can be defined anywhere)
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

  // Delete a session (regular function, not a hook)
  const deleteSession = async (sessionId: string) => {
    if (!sessionId) {
      console.error('Invalid session ID for deletion');
      return false;
    }

    try {
      console.log('Attempting to delete session:', sessionId);
      
      // First update the UI optimistically by removing the session from state
      setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
      
      // Remove from active sessions if present
      if (activeSessions.current.includes(sessionId)) {
        activeSessions.current = activeSessions.current.filter(id => id !== sessionId);
      }
      
      // Then perform the actual delete operation
      const success = await timeSessionsService.deleteSession(sessionId);
      
      if (success) {
        console.log('Session successfully deleted');
        // Recalculate total time without the deleted session
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setTotalTime(calculateTotalTime(updatedSessions));
        return true;
      } else {
        // If deletion failed, revert the optimistic update
        console.error('Failed to delete session, reverting UI');
        refreshSessions();
        return false;
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      // If there was an error, revert the optimistic update and refresh
      refreshSessions();
      setError(err instanceof Error ? err : new Error('Failed to delete session'));
      return false;
    }
  };

  return {
    sessions,
    isLoading,
    error,
    formatSessionTime,
    totalTime,
    deleteSession,
    refreshSessions
  };
}
