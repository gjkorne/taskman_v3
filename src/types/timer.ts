/**
 * Types related to task timing functionality
 */

// Status of a timing session
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

// A single timing session for a task
export interface TaskSession {
  id: string;
  task_id: string;
  start_time: string; // ISO date string
  end_time: string | null; // ISO date string
  duration: string | null; // PostgreSQL interval string
  notes: string | null;
  created_by: string;
  created_at: string;
  is_deleted: boolean;
}

// Current timer state
export interface TimerState {
  status: TimerStatus;
  taskId: string | null;
  sessionId: string | null;
  startTime: Date | null;
  elapsedTime: number; // milliseconds
  previouslyElapsed: number; // milliseconds from previous sessions
}

// Timer context shape
export interface TimerContextType {
  timerState: TimerState;
  startTimer: (taskId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => void;
  formatElapsedTime: (format?: 'short' | 'long') => string;
}
