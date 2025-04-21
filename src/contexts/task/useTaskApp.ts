import { useTaskContext } from './index';
import type { TaskContextType } from './index';

/**
 * Facade hook that provides both data and UI context in one.
 */
export function useTaskApp(): TaskContextType {
  return useTaskContext();
}
