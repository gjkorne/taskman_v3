import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TimeSession } from '../../services/api/timeSessionsService';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { useToast } from '../../components/Toast';

// Cache keys for React Query
export const TIME_SESSION_QUERY_KEYS = {
  all: ['time-sessions'] as const,
  lists: () => [...TIME_SESSION_QUERY_KEYS.all, 'list'] as const,
  list: (filter?: string) => [...TIME_SESSION_QUERY_KEYS.lists(), filter] as const,
  active: () => [...TIME_SESSION_QUERY_KEYS.all, 'active'] as const,
  byTask: () => [...TIME_SESSION_QUERY_KEYS.all, 'by-task'] as const,
  task: (taskId: string) => [...TIME_SESSION_QUERY_KEYS.byTask(), taskId] as const,
  byDate: () => [...TIME_SESSION_QUERY_KEYS.all, 'by-date'] as const,
  dateRange: (start: string, end: string) => [...TIME_SESSION_QUERY_KEYS.byDate(), start, end] as const,
  details: () => [...TIME_SESSION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TIME_SESSION_QUERY_KEYS.details(), id] as const,
  metrics: () => [...TIME_SESSION_QUERY_KEYS.all, 'metrics'] as const,
  today: () => [...TIME_SESSION_QUERY_KEYS.metrics(), 'today'] as const,
  week: () => [...TIME_SESSION_QUERY_KEYS.metrics(), 'week'] as const,
};

// Types for the data context
interface TimeSessionDataContextType {
  // State
  sessions: TimeSession[];
  activeSession: TimeSession | null;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  
  // Data operations
  fetchSessions: () => Promise<void>;
  getSessionsByTaskId: (taskId: string) => Promise<TimeSession[]>;
  getSessionsInDateRange: (startDate: Date, endDate: Date) => Promise<TimeSession[]>;
  createSession: (taskId: string) => Promise<TimeSession | null>;
  updateSession: (id: string, data: Partial<TimeSession>) => Promise<TimeSession | null>;
  deleteSession: (id: string) => Promise<boolean>;
  stopSession: (id: string) => Promise<TimeSession | null>;
  
  // Metrics calculations
  calculateTimeSpent: (taskIds?: string[], startDate?: Date, endDate?: Date) => Promise<number>;
  calculateTodayTimeSpent: () => Promise<number>;
  calculateWeekTimeSpent: () => Promise<number>;
}

// Create context with default values
export const TimeSessionDataContext = createContext<TimeSessionDataContextType | undefined>(undefined);

// Time Session Data Provider component
export const TimeSessionDataProvider = ({ children }: { children: ReactNode }) => {
  // Get the time session service from the service registry
  const timeSessionsService = ServiceRegistry.getTimeSessionService();
  
  // Get query client from React Query
  const queryClient = useQueryClient();
  
  // Get toast notifications
  const { addToast } = useToast();
  
  // Main query for sessions
  const { 
    data: sessions = [], 
    isLoading,
    isRefetching: isRefreshing,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: TIME_SESSION_QUERY_KEYS.lists(),
    queryFn: async () => {
      try {
        // This will trigger the 'sessions-loaded' event which is handled by the service
        return await timeSessionsService.getUserSessions();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to fetch time sessions');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Query for active session
  const { 
    data: activeSession = null,
  } = useQuery({
    queryKey: TIME_SESSION_QUERY_KEYS.active(),
    queryFn: async () => {
      try {
        return await timeSessionsService.getActiveSession();
      } catch (error) {
        console.error('Error checking for active session:', error);
        return null;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refresh every minute to keep track of active session
    refetchOnWindowFocus: true,
  });
  
  // Error handling
  const error = sessionsError instanceof Error ? sessionsError.message : null;
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await timeSessionsService.createSession(taskId);
    },
    onSuccess: (newSession) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.active() });
      
      if (newSession?.task_id) {
        queryClient.invalidateQueries({ 
          queryKey: TIME_SESSION_QUERY_KEYS.task(newSession.task_id) 
        });
      }
      
      // Optimistically update cache
      queryClient.setQueryData(
        TIME_SESSION_QUERY_KEYS.detail(newSession?.id as string),
        newSession
      );
      
      addToast('Time session started', 'success');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create time session';
      addToast(`Error creating time session: ${errorMessage}`, 'error');
    }
  });
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeSession> }) => {
      return await timeSessionsService.updateSession(id, data);
    },
    onSuccess: (updatedSession) => {
      if (!updatedSession) return;
      
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.lists() });
      
      if (updatedSession.end_time) {
        // If session ended, invalidate the active session query
        queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.active() });
      }
      
      if (updatedSession.task_id) {
        queryClient.invalidateQueries({ 
          queryKey: TIME_SESSION_QUERY_KEYS.task(updatedSession.task_id) 
        });
      }
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.metrics() });
      
      // Optimistically update cache
      queryClient.setQueryData(
        TIME_SESSION_QUERY_KEYS.detail(updatedSession.id),
        updatedSession
      );
      
      addToast('Time session updated', 'success');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update time session';
      addToast(`Error updating time session: ${errorMessage}`, 'error');
    }
  });
  
  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await timeSessionsService.deleteSession(id);
      return { id, result };
    },
    onSuccess: ({ id, result }) => {
      if (!result) return;
      
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.active() });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.metrics() });
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: TIME_SESSION_QUERY_KEYS.detail(id) });
      
      addToast('The time session has been removed', 'success');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete time session';
      addToast(`Error deleting time session: ${errorMessage}`, 'error');
    }
  });
  
  // Stop session mutation
  const stopSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await timeSessionsService.stopSession(id);
    },
    onSuccess: (stoppedSession) => {
      if (!stoppedSession) return;
      
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.active() });
      
      if (stoppedSession.task_id) {
        queryClient.invalidateQueries({ 
          queryKey: TIME_SESSION_QUERY_KEYS.task(stoppedSession.task_id) 
        });
      }
      
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.metrics() });
      
      // Optimistically update cache
      queryClient.setQueryData(
        TIME_SESSION_QUERY_KEYS.detail(stoppedSession.id),
        stoppedSession
      );
      
      addToast('Time session stopped', 'success');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop time session';
      addToast(`Error stopping time session: ${errorMessage}`, 'error');
    }
  });
  
  // API handlers with a similar interface to the old implementation
  const fetchSessions = useCallback(async (): Promise<void> => {
    try {
      await refetchSessions();
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, [refetchSessions]);
  
  // Function to get sessions for a specific task
  const getSessionsByTaskId = useCallback(async (taskId: string): Promise<TimeSession[]> => {
    try {
      // Use the queryClient directly for this case
      const result = await queryClient.fetchQuery({
        queryKey: TIME_SESSION_QUERY_KEYS.task(taskId),
        queryFn: async () => {
          return await timeSessionsService.getSessionsByTaskId(taskId);
        }
      });
      return result || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch task sessions';
      addToast(`Error loading task time sessions: ${errorMessage}`, 'error');
      return [];
    }
  }, [timeSessionsService, queryClient, addToast]);
  
  // Function to get sessions in a date range
  const getSessionsInDateRange = useCallback(async (startDate: Date, endDate: Date): Promise<TimeSession[]> => {
    try {
      // Format dates as ISO strings for query keys
      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();
      
      const result = await queryClient.fetchQuery({
        queryKey: TIME_SESSION_QUERY_KEYS.dateRange(startStr, endStr),
        queryFn: async () => {
          return await timeSessionsService.getSessionsByDateRange(startDate, endDate);
        },
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
      return result || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sessions by date';
      addToast(`Error loading time sessions: ${errorMessage}`, 'error');
      return [];
    }
  }, [timeSessionsService, queryClient, addToast]);
  
  // Function to create a new session
  const createSession = useCallback(async (taskId: string): Promise<TimeSession | null> => {
    try {
      return await createSessionMutation.mutateAsync(taskId);
    } catch (error) {
      // Error handling is done in the mutation
      return null;
    }
  }, [createSessionMutation]);
  
  // Function to update a session
  const updateSession = useCallback(async (id: string, data: Partial<TimeSession>): Promise<TimeSession | null> => {
    try {
      return await updateSessionMutation.mutateAsync({ id, data });
    } catch (error) {
      // Error handling is done in the mutation
      return null;
    }
  }, [updateSessionMutation]);
  
  // Function to delete a session
  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { result } = await deleteSessionMutation.mutateAsync(id);
      return result;
    } catch (error) {
      // Error handling is done in the mutation
      return false;
    }
  }, [deleteSessionMutation]);
  
  // Function to stop a session
  const stopSession = useCallback(async (id: string): Promise<TimeSession | null> => {
    try {
      return await stopSessionMutation.mutateAsync(id);
    } catch (error) {
      // Error handling is done in the mutation
      return null;
    }
  }, [stopSessionMutation]);
  
  // Function to calculate time spent
  const calculateTimeSpent = useCallback(async (taskIds?: string[], startDate?: Date, endDate?: Date): Promise<number> => {
    try {
      return await timeSessionsService.calculateTimeSpent(taskIds, startDate, endDate);
    } catch (error) {
      console.error('Error calculating time spent:', error);
      return 0;
    }
  }, [timeSessionsService]);
  
  // Calculate time spent today
  const calculateTodayTimeSpent = useCallback(async (): Promise<number> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    try {
      const result = await queryClient.fetchQuery({
        queryKey: TIME_SESSION_QUERY_KEYS.today(),
        queryFn: async () => calculateTimeSpent(undefined, today, tomorrow),
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
      return result;
    } catch (error) {
      console.error('Error calculating today time spent:', error);
      return 0;
    }
  }, [calculateTimeSpent, queryClient]);
  
  // Calculate time spent this week
  const calculateWeekTimeSpent = useCallback(async (): Promise<number> => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    try {
      const result = await queryClient.fetchQuery({
        queryKey: TIME_SESSION_QUERY_KEYS.week(),
        queryFn: async () => calculateTimeSpent(undefined, startOfWeek, endOfWeek),
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
      return result;
    } catch (error) {
      console.error('Error calculating week time spent:', error);
      return 0;
    }
  }, [calculateTimeSpent, queryClient]);
  
  // Context value - using useMemo to prevent unnecessary re-renders
  const value = useMemo<TimeSessionDataContextType>(() => ({
    // State
    sessions,
    activeSession,
    isLoading,
    error,
    isRefreshing,
    
    // Data operations
    fetchSessions,
    getSessionsByTaskId,
    getSessionsInDateRange,
    createSession,
    updateSession,
    deleteSession,
    stopSession,
    
    // Metrics calculations
    calculateTimeSpent,
    calculateTodayTimeSpent,
    calculateWeekTimeSpent,
  }), [
    sessions,
    activeSession,
    isLoading,
    error,
    isRefreshing,
    fetchSessions,
    getSessionsByTaskId,
    getSessionsInDateRange,
    createSession,
    updateSession,
    deleteSession,
    stopSession,
    calculateTimeSpent,
    calculateTodayTimeSpent,
    calculateWeekTimeSpent
  ]);
  
  return (
    <TimeSessionDataContext.Provider value={value}>
      {children}
    </TimeSessionDataContext.Provider>
  );
};

// Custom hook to use time session data context
export const useTimeSessionData = () => {
  const context = useContext(TimeSessionDataContext);
  
  if (context === undefined) {
    throw new Error('useTimeSessionData must be used within a TimeSessionDataProvider');
  }
  
  return context;
};
