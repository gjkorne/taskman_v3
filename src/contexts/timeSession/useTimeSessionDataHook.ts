import { useCallback } from 'react';
import { useTimeSessionQueries, TIME_SESSION_QUERY_KEYS } from './timeSessionQueries';
import { useTimeSessionMutations } from './timeSessionMutations';
import type { UseTimeSessionDataHookResult, TimeSession } from './types';

/**
 * Modular hook to manage time session data, mutations, calculators, and fetchers.
 * Composes queries and mutations from separate modules for maintainability.
 */
const useTimeSessionDataHook = (): UseTimeSessionDataHookResult => {
  const {
    sessions,
    activeSession,
    isLoading,
    isRefreshing,
    error,
    refetchSessions,
    queryClient,
    service,
  } = useTimeSessionQueries();
  const { createMutation, updateMutation, deleteMutation, stopMutation } = useTimeSessionMutations();

  // Fetchers
  const fetchSessions = useCallback(async () => { await refetchSessions(); }, [refetchSessions]);
  const getSessionsByTaskId = useCallback(async (taskId: string) => {
    try {
      return await queryClient.fetchQuery({ queryKey: TIME_SESSION_QUERY_KEYS.task(taskId), queryFn: () => service.getSessionsByTaskId(taskId) }) || [];
    } catch (e) { return []; }
  }, [queryClient, service]);
  const getSessionsInDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    const s = startDate.toISOString(); const e = endDate.toISOString();
    try {
      return await queryClient.fetchQuery({ queryKey: TIME_SESSION_QUERY_KEYS.dateRange(s, e), queryFn: () => service.getSessionsByDateRange(startDate, endDate), staleTime: 5 * 60 * 1000 }) || [];
    } catch (e) { return []; }
  }, [queryClient, service]);

  // Calculators
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
    queries: {
      sessions,
      activeSession,
      isLoading,
      isRefreshing,
      error,
    },
    mutations: {
      createSession: useCallback(async (taskId: string) => {
        try { return await createMutation.mutateAsync(taskId); } catch { return null; }
      }, [createMutation]),
      updateSession: useCallback(async (id: string, data: Partial<TimeSession>) => {
        try { return await updateMutation.mutateAsync({ id, data }); } catch { return null; }
      }, [updateMutation]),
      deleteSession: useCallback(async (id: string) => {
        try { return await deleteMutation.mutateAsync(id); } catch { return false; }
      }, [deleteMutation]),
      stopSession: useCallback(async (id: string) => {
        try { return await stopMutation.mutateAsync(id); } catch { return null; }
      }, [stopMutation]),
    },
    calculators: {
      calculateTimeSpent,
      calculateTodayTimeSpent,
      calculateWeekTimeSpent,
    },
    fetchers: {
      fetchSessions,
      getSessionsByTaskId,
      getSessionsInDateRange,
    },
  };
};

export default useTimeSessionDataHook;
