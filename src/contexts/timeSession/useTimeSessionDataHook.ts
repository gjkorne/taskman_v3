import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TimeSession } from '../../services/api/timeSessionsService';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { useToast } from '../../components/Toast';

// Cache keys for React Query
export const TIME_SESSION_QUERY_KEYS = {
  all: ['time-sessions'] as const,
  lists: () => [...TIME_SESSION_QUERY_KEYS.all, 'list'] as const,
  list: (filter?: string) => [...TIME_SESSION_QUERY_KEYS.lists(), filter] as const,
  active: () => [...TIME_SESSION_QUERY_KEYS.all, 'active'] as const,
  byTask: () => [...TIME_SESSION_QUERY_KEYS.all, 'by-task'] as const,
  task: (taskId: string) => [...TIME_SESSION_QUERY_KEYS.byTask(), taskId] as const,
  byDate: () => [...TIME_SESSION_QUERY_KEYS.all, 'by-date'] as const,
  dateRange: (start: string, end: string) => [...TIME_SESSION_QUERY_KEYS.byDate(), start, end] as const,
  details: () => [...TIME_SESSION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TIME_SESSION_QUERY_KEYS.details(), id] as const,
  metrics: () => [...TIME_SESSION_QUERY_KEYS.all, 'metrics'] as const,
  today: () => [...TIME_SESSION_QUERY_KEYS.metrics(), 'today'] as const,
  week: () => [...TIME_SESSION_QUERY_KEYS.metrics(), 'week'] as const,
};

export default function useTimeSessionDataHook() {
  const service = ServiceRegistry.getTimeSessionService();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const {
    data: sessions = [],
    isLoading,
    isRefetching: isRefreshing,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery<TimeSession[], Error>({
    queryKey: TIME_SESSION_QUERY_KEYS.lists(),
    queryFn: async () => service.getUserSessions(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: activeSession = null } = useQuery<TimeSession | null, Error>({
    queryKey: TIME_SESSION_QUERY_KEYS.active(),
    queryFn: async () => {
      try {
        return await service.getActiveSession();
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation<TimeSession | null, Error, string>({
    mutationFn: (taskId: string) => service.createSession(taskId),
    onSuccess: (newSession: TimeSession | null) => {
      if (!newSession) return;
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.active() });
      if (newSession.task_id)
        queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.task(newSession.task_id) });
      queryClient.setQueryData(TIME_SESSION_QUERY_KEYS.detail(newSession.id), newSession);
      addToast('Time session started', 'success');
    },
    onError: (error: Error) => {
      addToast(`Error creating time session: ${error.message}`, 'error');
    },
  });

  const updateMutation = useMutation<TimeSession | null, Error, { id: string; data: Partial<TimeSession> }>({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeSession> }) => service.updateSession(id, data),
    onSuccess: (sess: TimeSession | null) => {
      if (!sess) return;
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.lists() });
      if (sess.end_time) queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.active() });
      if (sess.task_id) queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.task(sess.task_id) });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.metrics() });
      queryClient.setQueryData(TIME_SESSION_QUERY_KEYS.detail(sess.id), sess);
      addToast('Time session updated', 'success');
    },
    onError: (error: Error) => {
      addToast(`Error updating time session: ${error.message}`, 'error');
    },
  });

  const deleteMutation = useMutation<boolean, Error, string>({
    mutationFn: (id: string) => service.deleteSession(id),
    onSuccess: (result: boolean, id: string) => {
      if (!result) return;
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.active() });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.metrics() });
      queryClient.removeQueries({ queryKey: TIME_SESSION_QUERY_KEYS.detail(id) });
      addToast('Time session deleted', 'success');
    },
    onError: (error: Error) => {
      addToast(`Error deleting time session: ${error.message}`, 'error');
    },
  });

  const stopMutation = useMutation<TimeSession | null, Error, string>({
    mutationFn: (id: string) => service.stopSession(id),
    onSuccess: (sess: TimeSession | null) => {
      if (!sess) return;
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.active() });
      if (sess.task_id) queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.task(sess.task_id) });
      queryClient.invalidateQueries({ queryKey: TIME_SESSION_QUERY_KEYS.metrics() });
      queryClient.setQueryData(TIME_SESSION_QUERY_KEYS.detail(sess.id), sess);
      addToast('Time session stopped', 'success');
    },
    onError: (error: Error) => {
      addToast(`Error stopping time session: ${error.message}`, 'error');
    },
  });

  const fetchSessions = useCallback(async () => { await refetchSessions(); }, [refetchSessions]);
  const getSessionsByTaskId = useCallback(async (taskId: string) => {
    try {
      return await queryClient.fetchQuery({ queryKey: TIME_SESSION_QUERY_KEYS.task(taskId), queryFn: () => service.getSessionsByTaskId(taskId) }) || [];
    } catch (e) { addToast(`Error loading task sessions: ${e instanceof Error ? e.message : e}`, 'error'); return []; }
  }, [queryClient, service, addToast]);
  const getSessionsInDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    const s = startDate.toISOString(); const e = endDate.toISOString();
    try {
      return await queryClient.fetchQuery({ queryKey: TIME_SESSION_QUERY_KEYS.dateRange(s, e), queryFn: () => service.getSessionsByDateRange(startDate, endDate), staleTime: 5 * 60 * 1000 }) || [];
    } catch (e) { addToast(`Error loading time sessions: ${e instanceof Error ? e.message : e}`, 'error'); return []; }
  }, [queryClient, service, addToast]);

  const createSession = useCallback(async (taskId: string) => { try { return await createMutation.mutateAsync(taskId); } catch { return null; } }, [createMutation]);
  const updateSession = useCallback(async (id: string, data: Partial<TimeSession>) => { try { return await updateMutation.mutateAsync({ id, data }); } catch { return null; } }, [updateMutation]);
  const deleteSession = useCallback(async (id: string) => { try { await deleteMutation.mutateAsync(id); return true; } catch { return false; } }, [deleteMutation]);
  const stopSession = useCallback(async (id: string) => { try { return await stopMutation.mutateAsync(id); } catch { return null; } }, [stopMutation]);

  const calculateTimeSpent = useCallback(async (taskIds?: string[], startDate?: Date, endDate?: Date) => { try { return await service.calculateTimeSpent(taskIds, startDate, endDate); } catch { return 0; } }, [service]);
  const calculateTodayTimeSpent = useCallback(async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    try { return await queryClient.fetchQuery({ queryKey: TIME_SESSION_QUERY_KEYS.today(), queryFn: () => calculateTimeSpent(undefined, today, tomorrow), staleTime: 5 * 60 * 1000 }) || 0; } catch { return 0; }
  }, [queryClient, calculateTimeSpent]);
  const calculateWeekTimeSpent = useCallback(async () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    try { return await queryClient.fetchQuery({ queryKey: TIME_SESSION_QUERY_KEYS.week(), queryFn: () => calculateTimeSpent(undefined, startOfWeek, endOfWeek), staleTime: 5 * 60 * 1000 }) || 0; } catch { return 0; }
  }, [queryClient, calculateTimeSpent]);

  return {
    sessions,
    activeSession,
    isLoading,
    isRefreshing,
    error: sessionsError instanceof Error ? sessionsError.message : null,
    fetchSessions,
    getSessionsByTaskId,
    getSessionsInDateRange,
    createSession,
    updateSession,
    deleteSession,
    stopSession,
    calculateTimeSpent,
    calculateTodayTimeSpent,
    calculateWeekTimeSpent,
  };
}
