import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { TimeSession } from '../../services/api/timeSessionsService';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { useToast } from '../../components/Toast';
import { ServiceError } from '../../services/BaseService';

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
  
  // Time session data state
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get toast notifications
  const { addToast } = useToast();
  
  // Set up event listeners for time session changes
  useEffect(() => {
    // Subscribe to time session service events
    const unsubs = [
      timeSessionsService.on('sessions-loaded', (loadedSessions: TimeSession[]) => {
        setSessions(loadedSessions);
      }),
      
      timeSessionsService.on('session-created', (session: TimeSession) => {
        setSessions(prev => [...prev, session]);
        if (!session.end_time) {
          setActiveSession(session);
        }
      }),
      
      timeSessionsService.on('session-updated', (updatedSession: TimeSession) => {
        setSessions(prev => 
          prev.map(session => session.id === updatedSession.id ? updatedSession : session)
        );
        
        // Update active session if this is the one that was updated
        if (activeSession?.id === updatedSession.id) {
          setActiveSession(updatedSession.end_time ? null : updatedSession);
        }
      }),
      
      timeSessionsService.on('session-deleted', (sessionId: string) => {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        // Clear active session if this was the active one
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
        }
      }),
      
      timeSessionsService.on('session-stopped', (stoppedSession: TimeSession) => {
        setSessions(prev => 
          prev.map(session => session.id === stoppedSession.id ? stoppedSession : session)
        );
        
        // Clear active session if this was the active one
        if (activeSession?.id === stoppedSession.id) {
          setActiveSession(null);
        }
      }),
      
      timeSessionsService.on('error', (error: ServiceError | Error) => {
        setError(error.message);
        addToast(`Time session operation failed: ${error.message}`, 'error');
      })
    ];
    
    // Check for active session on mount
    checkForActiveSession();
    
    // Initial data load
    fetchSessions();
    
    // Cleanup function
    return () => {
      unsubs.forEach(unsubscribe => unsubscribe());
    };
  }, [timeSessionsService]);
  
  // Check for any active session
  const checkForActiveSession = useCallback(async () => {
    try {
      const active = await timeSessionsService.getActiveSession();
      setActiveSession(active);
    } catch (err) {
      console.error('Error checking for active session:', err);
    }
  }, [timeSessionsService]);
  
  // Function to fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsRefreshing(true);
      
      await timeSessionsService.getUserSessions();
      
      // Note: actual sessions will be set via the event listener
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching sessions');
      setError(error.message);
      addToast(`Error loading time sessions: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeSessionsService, addToast]);
  
  // Function to get sessions for a specific task
  const getSessionsByTaskId = useCallback(async (taskId: string): Promise<TimeSession[]> => {
    try {
      setError(null);
      return await timeSessionsService.getSessionsByTaskId(taskId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching task sessions');
      setError(error.message);
      addToast(`Error loading task time sessions: ${error.message}`, 'error');
      return [];
    }
  }, [timeSessionsService, addToast]);
  
  // Function to get sessions in a date range
  const getSessionsInDateRange = useCallback(async (startDate: Date, endDate: Date): Promise<TimeSession[]> => {
    try {
      setError(null);
      return await timeSessionsService.getSessionsByDateRange(startDate, endDate);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching sessions by date');
      setError(error.message);
      addToast(`Error loading time sessions: ${error.message}`, 'error');
      return [];
    }
  }, [timeSessionsService, addToast]);
  
  // Function to create a new session
  const createSession = useCallback(async (taskId: string): Promise<TimeSession | null> => {
    try {
      setError(null);
      return await timeSessionsService.createSession(taskId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error creating session');
      setError(error.message);
      addToast(`Error creating time session: ${error.message}`, 'error');
      return null;
    }
  }, [timeSessionsService, addToast]);
  
  // Function to update a session
  const updateSession = useCallback(async (id: string, data: Partial<TimeSession>): Promise<TimeSession | null> => {
    try {
      setError(null);
      return await timeSessionsService.updateSession(id, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error updating session');
      setError(error.message);
      addToast(`Error updating time session: ${error.message}`, 'error');
      return null;
    }
  }, [timeSessionsService, addToast]);
  
  // Function to delete a session
  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await timeSessionsService.deleteSession(id);
      
      if (result) {
        addToast('The time session has been removed', 'success');
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error deleting session');
      setError(error.message);
      addToast(`Error deleting time session: ${error.message}`, 'error');
      return false;
    }
  }, [timeSessionsService, addToast]);
  
  // Function to stop a session
  const stopSession = useCallback(async (id: string): Promise<TimeSession | null> => {
    try {
      setError(null);
      return await timeSessionsService.stopSession(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error stopping session');
      setError(error.message);
      addToast(`Error stopping time session: ${error.message}`, 'error');
      return null;
    }
  }, [timeSessionsService, addToast]);
  
  // Function to calculate time spent
  const calculateTimeSpent = useCallback(async (taskIds?: string[], startDate?: Date, endDate?: Date): Promise<number> => {
    try {
      return await timeSessionsService.calculateTimeSpent(taskIds, startDate, endDate);
    } catch (err) {
      console.error('Error calculating time spent:', err);
      return 0;
    }
  }, [timeSessionsService]);
  
  // Calculate time spent today
  const calculateTodayTimeSpent = useCallback(async (): Promise<number> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return calculateTimeSpent(undefined, today, tomorrow);
  }, [calculateTimeSpent]);
  
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
    
    return calculateTimeSpent(undefined, startOfWeek, endOfWeek);
  }, [calculateTimeSpent]);
  
  // Context value - using useMemo to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
