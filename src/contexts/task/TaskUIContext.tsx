import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Types for the UI context
interface TaskUIContextType {
  // UI state
  editTaskId: string | null;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  taskToDelete: string | null;
  viewMode: 'list' | 'grid';
  
  // Modal controls
  openEditModal: (taskId: string) => void;
  closeEditModal: () => void;
  openDeleteModal: (taskId: string) => void;
  closeDeleteModal: () => void;
  
  // View controls
  setViewMode: (mode: 'list' | 'grid') => void;
}

// Create context with default values
export const TaskUIContext = createContext<TaskUIContextType | undefined>(undefined);

// Task UI Provider component
export const TaskUIProvider = ({ children }: { children: ReactNode }) => {
  // UI state
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Modal control functions - using useCallback to prevent unnecessary re-renders
  const openEditModal = useCallback((taskId: string) => {
    setEditTaskId(taskId);
    setIsEditModalOpen(true);
  }, []);
  
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    // Delayed cleanup to avoid UI flicker during modal transitions
    setTimeout(() => setEditTaskId(null), 300);
  }, []);
  
  const openDeleteModal = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  }, []);
  
  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    // Delayed cleanup to avoid UI flicker during modal transitions
    setTimeout(() => setTaskToDelete(null), 300);
  }, []);
  
  // Context value - using useMemo to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // UI state
    editTaskId,
    isEditModalOpen,
    isDeleteModalOpen,
    taskToDelete,
    viewMode,
    
    // Modal controls
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    
    // View controls
    setViewMode,
  }), [
    editTaskId,
    isEditModalOpen,
    isDeleteModalOpen,
    taskToDelete,
    viewMode,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal
  ]);
  
  return (
    <TaskUIContext.Provider value={value}>
      {children}
    </TaskUIContext.Provider>
  );
};

// Custom hook to use task UI context
export const useTaskUI = () => {
  const context = useContext(TaskUIContext);
  
  if (context === undefined) {
    throw new Error('useTaskUI must be used within a TaskUIProvider');
  }
  
  return context;
};
