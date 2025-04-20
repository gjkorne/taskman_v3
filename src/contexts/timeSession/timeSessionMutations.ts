import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { invalidateSessionQueries } from './timeSessionUtils';
import { TimeSession } from './types';
import { useToast, ToastType } from '../../components/Toast';

// Utility to handle mutation errors in a consistent way, using ToastType
type AddToast = (msg: string, type?: ToastType, duration?: number) => void;
function handleError(
  addToast: AddToast,
  action: string,
  type: ToastType = 'error',
  duration?: number
) {
  return (error: Error) =>
    addToast(`Error ${action}: ${error.message}`, type, duration);
}

export function useTimeSessionMutations() {
  const service = ServiceRegistry.getTimeSessionService();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const createMutation = useMutation<TimeSession | null, Error, string>({
    mutationFn: (taskId: string) => service.createSession(taskId),
    onSuccess: (newSession: TimeSession | null) => {
      if (!newSession) return;
      invalidateSessionQueries(queryClient, newSession);
      addToast('Time session started', 'success', 3000);
    },
    onError: handleError(addToast, 'creating time session', 'error', 3000),
  });

  const updateMutation = useMutation<
    TimeSession | null,
    Error,
    { id: string; data: Partial<TimeSession> }
  >({
    mutationFn: ({ id, data }) => service.updateSession(id, data),
    onSuccess: (sess: TimeSession | null) => {
      if (!sess) return;
      invalidateSessionQueries(queryClient, sess);
      addToast('Time session updated', 'success', 3000);
    },
    onError: handleError(addToast, 'updating time session', 'error', 3000),
  });

  const deleteMutation = useMutation<boolean, Error, string>({
    mutationFn: (id: string) => service.deleteSession(id),
    onSuccess: (result: boolean, id: string) => {
      if (!result) return;
      queryClient.invalidateQueries({ queryKey: ['time-sessions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['time-sessions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['time-sessions', 'metrics'] });
      queryClient.removeQueries({ queryKey: ['time-sessions', 'detail', id] });
      addToast('Time session deleted', 'success', 3000);
    },
    onError: handleError(addToast, 'deleting time session', 'error', 3000),
  });

  const stopMutation = useMutation<TimeSession | null, Error, string>({
    mutationFn: (id: string) => service.stopSession(id),
    onSuccess: (sess: TimeSession | null) => {
      if (!sess) return;
      invalidateSessionQueries(queryClient, sess);
      addToast('Time session stopped', 'success', 3000);
    },
    onError: handleError(addToast, 'stopping time session', 'error', 3000),
  });

  return { createMutation, updateMutation, deleteMutation, stopMutation };
}
