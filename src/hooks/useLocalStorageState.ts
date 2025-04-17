import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// Hook for state synchronized with localStorage
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        return JSON.parse(storedValue) as T;
      }
    } catch (e) {
      console.error(`Error reading localStorage key "${key}":`, e);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error(`Error writing localStorage key "${key}":`, e);
    }
  }, [key, state]);

  return [state, setState];
}
