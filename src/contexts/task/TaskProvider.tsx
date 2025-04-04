import { ReactNode, useMemo } from 'react';
import { TaskDataProvider, useTaskData } from './TaskDataContext';
import { TaskUIProvider, useTaskUI } from './TaskUIContext';
import { TaskContext } from './index';

// Combined provider that wraps both data and UI providers
// and provides backward compatibility with the old context
export const TaskProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TaskDataProvider>
      <TaskUIProvider>
        <LegacyBridge>
          {children}
        </LegacyBridge>
      </TaskUIProvider>
    </TaskDataProvider>
  );
};

// Bridge component to provide the legacy context
const LegacyBridge = ({ children }: { children: ReactNode }) => {
  const dataContext = useTaskData();
  const uiContext = useTaskUI();
  
  // Combine contexts for backward compatibility
  const combinedContext = useMemo(() => ({
    ...dataContext,
    ...uiContext
  }), [dataContext, uiContext]);
  
  return (
    <TaskContext.Provider value={combinedContext}>
      {children}
    </TaskContext.Provider>
  );
};
