import { TimeSession } from '../../services/api/timeSessionsService';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Utility to invalidate all queries related to time sessions.
 */
export function invalidateSessionQueries(queryClient: ReturnType<typeof useQueryClient>, session?: TimeSession | null) {
  queryClient.invalidateQueries({ queryKey: ["time-sessions", "list"] });
  queryClient.invalidateQueries({ queryKey: ["time-sessions", "active"] });
  if (session?.task_id) {
    queryClient.invalidateQueries({ queryKey: ["time-sessions", "by-task", session.task_id] });
  }
  queryClient.invalidateQueries({ queryKey: ["time-sessions", "metrics"] });
  if (session) {
    queryClient.setQueryData(["time-sessions", "detail", session.id], session);
  }
}

/**
 * Utility to handle mutation errors in a consistent way.
 */
export function handleError(
  addToast: (msg: string, type?: string, duration?: number) => void,
  action: string,
  type: string = 'error',
  duration?: number
) {
  return (error: Error) => addToast(`Error ${action}: ${error.message}`, type, duration);
}
