import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { TimeSession } from './types';

export const TIME_SESSION_QUERY_KEYS = {
  all: ['time-sessions'] as const,
  lists: () => [...TIME_SESSION_QUERY_KEYS.all, 'list'] as const,
  list: (filter?: string) =>
    [...TIME_SESSION_QUERY_KEYS.lists(), filter] as const,
  active: () => [...TIME_SESSION_QUERY_KEYS.all, 'active'] as const,
  byTask: () => [...TIME_SESSION_QUERY_KEYS.all, 'by-task'] as const,
  task: (taskId: string) =>
    [...TIME_SESSION_QUERY_KEYS.byTask(), taskId] as const,
  byDate: () => [...TIME_SESSION_QUERY_KEYS.all, 'by-date'] as const,
  dateRange: (start: string, end: string) =>
    [...TIME_SESSION_QUERY_KEYS.byDate(), start, end] as const,
  details: () => [...TIME_SESSION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TIME_SESSION_QUERY_KEYS.details(), id] as const,
  metrics: () => [...TIME_SESSION_QUERY_KEYS.all, 'metrics'] as const,
  today: () => [...TIME_SESSION_QUERY_KEYS.metrics(), 'today'] as const,
  week: () => [...TIME_SESSION_QUERY_KEYS.metrics(), 'week'] as const,
};

export function useTimeSessionQueries() {
  const service = ServiceRegistry.getTimeSessionService();
  const queryClient = useQueryClient();

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

  return {
    sessions,
    activeSession,
    isLoading,
    isRefreshing,
    error: sessionsError instanceof Error ? sessionsError.message : null,
    refetchSessions,
    queryClient,
    service,
  };
}
