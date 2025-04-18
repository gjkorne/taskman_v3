import React, { createContext, useContext, useState, useMemo, ReactNode, Dispatch, SetStateAction } from 'react';

type Config<S, A> = {
  /** Display name for context and hooks */
  displayName: string;
  /** Initial state object */
  initialState: S;
  /** Actions factory: receives state and setState, returns action handlers */
  actions: (
    state: S,
    setState: Dispatch<SetStateAction<S>>
  ) => A;
};

/**
 * Creates a UI context with provider and hook, merging state and actions.
 * @example
 * const { Provider: FooUIProvider, useUIContext: useFooUI } = createUIContext({
 *   displayName: 'Foo',
 *   initialState: { isOpen: false },
 *   actions: (state, set) => ({ open: () => set(s => ({ ...s, isOpen: true })) })
 * });
 */
export function createUIContext<S, A>(config: Config<S, A>) {
  type ContextType = S & A;

  const Context = createContext<ContextType | undefined>(undefined);
  Context.displayName = `${config.displayName}UIContext`;

  const Provider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<S>(config.initialState);
    const actions = useMemo(() => config.actions(state, setState), [state]);
    const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
    return React.createElement(Context.Provider, { value }, children);
  };

  const useUIContext = (): ContextType => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error(
        `use${config.displayName}UI must be used within ${config.displayName}UIProvider`
      );
    }
    return context;
  };

  return { Provider, useUIContext };
}
