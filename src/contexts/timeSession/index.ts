import { createContext } from 'react';
import { useTimeSessionData } from './TimeSessionDataContext';
import { useTimeSessionUI } from './TimeSessionUIContext';
import { TimeSessionProvider } from './TimeSessionProvider';
import { TimeSession } from '../../services/api/timeSessionsService';

// Combined context type for backward compatibility
export interface TimeSessionContextType {
  // Data state
  sessions: TimeSession[];
  activeSession: TimeSession | null;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  
  // UI state
  isTimerModalOpen: boolean;
  isHistoryModalOpen: boolean;
  selectedSessionId: string | null;
  timerDisplayMode: 'compact' | 'full';
  
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
  
  // Modal controls
  openTimerModal: () => void;
  closeTimerModal: () => void;
  openHistoryModal: (sessionId?: string) => void;
  closeHistoryModal: () => void;
  
  // Display controls
  setTimerDisplayMode: (mode: 'compact' | 'full') => void;
}

// Create legacy context for backward compatibility
export const TimeSessionContext = createContext<TimeSessionContextType | undefined>(undefined);

// Legacy hook that combines both contexts for backward compatibility
export const useTimeSessionContext = (): TimeSessionContextType => {
  const dataContext = useTimeSessionData();
  const uiContext = useTimeSessionUI();
  
  return {
    ...dataContext,
    ...uiContext
  };
};

// Named exports for the new pattern
export { 
  TimeSessionProvider,
  useTimeSessionData,
  useTimeSessionUI
};

// Default export for backward compatibility
export default TimeSessionContext;
