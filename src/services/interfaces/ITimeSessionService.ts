import { IService } from './IService';
import { TimeSession } from '../api/timeSessionsService';

/**
 * Event types that can be emitted by the TimeSessionService
 */
export interface TimeSessionEvents {
  'session-created': TimeSession;
  'session-updated': TimeSession;
  'session-deleted': string;
  'session-started': TimeSession;
  'session-paused': TimeSession;
  'session-stopped': TimeSession;
  'sessions-loaded': TimeSession[];
  'error': Error;
}

/**
 * Interface for the TimeSessionService
 */
export interface ITimeSessionService extends IService<TimeSessionEvents> {
  /**
   * Get all time sessions for the current user
   */
  getUserSessions(): Promise<TimeSession[]>;
  
  /**
   * Get time sessions for a specific task
   */
  getSessionsByTaskId(taskId: string): Promise<TimeSession[]>;
  
  /**
   * Get time sessions for a specific time period
   */
  getSessionsByDateRange(startDate: Date, endDate: Date): Promise<TimeSession[]>;
  
  /**
   * Get a specific time session by ID
   */
  getSessionById(id: string): Promise<TimeSession | null>;
  
  /**
   * Create a new time session
   */
  createSession(taskId: string): Promise<TimeSession | null>;
  
  /**
   * Update a time session
   */
  updateSession(id: string, data: Partial<TimeSession>): Promise<TimeSession | null>;
  
  /**
   * Delete a time session
   */
  deleteSession(id: string): Promise<boolean>;
  
  /**
   * Stop a time session (set end_time)
   */
  stopSession(id: string): Promise<TimeSession | null>;
  
  /**
   * Calculate total time spent on tasks in a given period
   */
  calculateTimeSpent(taskIds?: string[], startDate?: Date, endDate?: Date): Promise<number>;
}
