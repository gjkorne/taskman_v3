import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Types for the UI context
interface TimeSessionUIContextType {
  // UI state
  isTimerModalOpen: boolean;
  isHistoryModalOpen: boolean;
  selectedSessionId: string | null;
  timerDisplayMode: 'compact' | 'full';
  
  // Modal controls
  openTimerModal: () => void;
  closeTimerModal: () => void;
  openHistoryModal: (sessionId?: string) => void;
  closeHistoryModal: () => void;
  
  // Display controls
  setTimerDisplayMode: (mode: 'compact' | 'full') => void;
}

// Create context with default values
export const TimeSessionUIContext = createContext<TimeSessionUIContextType | undefined>(undefined);

// Time Session UI Provider component
export const TimeSessionUIProvider = ({ children }: { children: ReactNode }) => {
  // UI state
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [timerDisplayMode, setTimerDisplayMode] = useState<'compact' | 'full'>('compact');
  
  // Modal control functions - using useCallback to prevent unnecessary re-renders
  const openTimerModal = useCallback(() => {
    setIsTimerModalOpen(true);
  }, []);
  
  const closeTimerModal = useCallback(() => {
    setIsTimerModalOpen(false);
  }, []);
  
  const openHistoryModal = useCallback((sessionId?: string) => {
    if (sessionId) {
      setSelectedSessionId(sessionId);
    }
    setIsHistoryModalOpen(true);
  }, []);
  
  const closeHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(false);
    // Clear session ID immediately to avoid stale state
    setSelectedSessionId(null);
    // Delayed cleanup to avoid UI flicker during modal transitions
    setTimeout(() => setSelectedSessionId(null), 300);
  }, []);
  
  // Context value - using useMemo to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // UI state
    isTimerModalOpen,
    isHistoryModalOpen,
    selectedSessionId,
    timerDisplayMode,
    
    // Modal controls
    openTimerModal,
    closeTimerModal,
    openHistoryModal,
    closeHistoryModal,
    
    // Display controls
    setTimerDisplayMode,
  }), [
    isTimerModalOpen,
    isHistoryModalOpen,
    selectedSessionId,
    timerDisplayMode,
    openTimerModal,
    closeTimerModal,
    openHistoryModal,
    closeHistoryModal,
  ]);
  
  return (
    <TimeSessionUIContext.Provider value={value}>
      {children}
    </TimeSessionUIContext.Provider>
  );
};

// Custom hook to use time session UI context
export const useTimeSessionUI = () => {
  const context = useContext(TimeSessionUIContext);
  
  if (context === undefined) {
    throw new Error('useTimeSessionUI must be used within a TimeSessionUIProvider');
  }
  
  return context;
};
