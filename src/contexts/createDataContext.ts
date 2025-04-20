import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Factory to create data contexts from a hook.
 * @param useHook Hook returning the context value.
 * @param displayName Base name for Context and hooks.
 */
export function createDataContext<T>(useHook: () => T, displayName: string) {
  const Context = createContext<T | undefined>(undefined);
  Context.displayName = `${displayName}Context`;

  const Provider = ({ children }: { children: ReactNode }) => {
    const value = useHook();
    return React.createElement(Context.Provider, { value }, children);
  };

  function useDataContext(): T {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error(
        `use${displayName} must be used within ${displayName}Provider`
      );
    }
    return context;
  }

  return { Provider, useDataContext };
}
