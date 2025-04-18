import { TimeSession } from '../../services/api/timeSessionsService';

export type { TimeSession };

export interface UseTimeSessionDataHookResult {
  queries: {
    sessions: TimeSession[];
    activeSession: TimeSession | null;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
  };
  mutations: {
    createSession: (taskId: string) => Promise<TimeSession | null>;
    updateSession: (id: string, data: Partial<TimeSession>) => Promise<TimeSession | null>;
    deleteSession: (id: string) => Promise<boolean>;
    stopSession: (id: string) => Promise<TimeSession | null>;
  };
  calculators: {
    calculateTimeSpent: (taskIds?: string[], startDate?: Date, endDate?: Date) => Promise<number>;
    calculateTodayTimeSpent: () => Promise<number>;
    calculateWeekTimeSpent: () => Promise<number>;
  };
  fetchers: {
    fetchSessions: () => Promise<void>;
    getSessionsByTaskId: (taskId: string) => Promise<TimeSession[]>;
    getSessionsInDateRange: (startDate: Date, endDate: Date) => Promise<TimeSession[]>;
  };
}
