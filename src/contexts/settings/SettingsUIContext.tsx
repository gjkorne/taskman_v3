import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Types for the UI context
interface SettingsUIContextType {
  // UI state
  isSettingsModalOpen: boolean;
  activeSettingsTab: string;
  showAdvancedSettings: boolean;
  
  // Modal controls
  openSettingsModal: (initialTab?: string) => void;
  closeSettingsModal: () => void;
  setActiveTab: (tab: string) => void;
  
  // Display controls
  toggleAdvancedSettings: () => void;
}

// Create context with default values
export const SettingsUIContext = createContext<SettingsUIContextType | undefined>(undefined);

// Settings UI Provider component
export const SettingsUIProvider = ({ children }: { children: ReactNode }) => {
  // UI state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Modal control functions - using useCallback to prevent unnecessary re-renders
  const openSettingsModal = useCallback((initialTab?: string) => {
    if (initialTab) {
      setActiveSettingsTab(initialTab);
    }
    setIsSettingsModalOpen(true);
  }, []);
  
  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);
  
  const setActiveTab = useCallback((tab: string) => {
    setActiveSettingsTab(tab);
  }, []);
  
  // Display control functions
  const toggleAdvancedSettings = useCallback(() => {
    setShowAdvancedSettings(prev => !prev);
  }, []);
  
  // Context value - using useMemo to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // UI state
    isSettingsModalOpen,
    activeSettingsTab,
    showAdvancedSettings,
    
    // Modal controls
    openSettingsModal,
    closeSettingsModal,
    setActiveTab,
    
    // Display controls
    toggleAdvancedSettings,
  }), [
    isSettingsModalOpen,
    activeSettingsTab,
    showAdvancedSettings,
    openSettingsModal,
    closeSettingsModal,
    setActiveTab,
    toggleAdvancedSettings
  ]);
  
  return (
    <SettingsUIContext.Provider value={value}>
      {children}
    </SettingsUIContext.Provider>
  );
};

// Custom hook to use settings UI context
export const useSettingsUI = () => {
  const context = useContext(SettingsUIContext);
  
  if (context === undefined) {
    throw new Error('useSettingsUI must be used within a SettingsUIProvider');
  }
  
  return context;
};
