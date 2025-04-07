import { supabase } from '../../lib/supabase';
import { BaseService, ServiceError } from '../BaseService';
import { ITimeSessionService, TimeSessionEvents } from '../interfaces/ITimeSessionService';
import { TaskStatusType } from '../../types/task';
import { determineStatusFromSessions } from '../../utils/taskStatusUtils';

/**
 * Time session interface matching the Supabase database schema
 */
export interface TimeSession {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: string | null; // PostgreSQL interval as string
  created_at: string;
  notes?: string;
  status?: string; // Added status field to track session status
  is_deleted?: boolean; // Add is_deleted field for soft deletion
  // Add task information from joined queries
  tasks?: {
    title?: string;
    status?: string;
    priority?: string;
    category_name?: string;
    is_deleted?: boolean;
  };
}

// Define session status constants for consistent usage
export enum TimeSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

/**
 * Service for managing time sessions
 * Implements the ITimeSessionService interface and extends BaseService
 * for standardized error handling and event management
 */
export class TimeSessionsService extends BaseService<TimeSessionEvents> implements ITimeSessionService {
  constructor() {
    super();
    this.markReady();
  }

  /**
   * Get all time sessions for a specific task
   */
  async getSessionsByTaskId(taskId: string): Promise<TimeSession[]> {
    try {
      const { data, error } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('task_id', taskId)
        .eq('is_deleted', false)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      this.emit('sessions-loaded', data as TimeSession[]);
      return data as TimeSession[];
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.fetch_error');
      this.emit('error', serviceError);
      return [];
    }
  }

  /**
   * Get all time sessions for the current user
   */
  async getUserSessions(): Promise<TimeSession[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('time_sessions')
        .select('*, tasks(title, status, priority, category_name, is_deleted)')
        .eq('user_id', userData.user.id)
        .eq('is_deleted', false) // Filter out soft-deleted sessions
        .order('start_time', { ascending: false });
        
      if (error) throw error;
      
      // Filter out sessions for deleted tasks
      const filteredData = data?.filter(session => !session.tasks?.is_deleted) as TimeSession[];
      
      this.emit('sessions-loaded', filteredData);
      return filteredData;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.user_sessions_error');
      this.emit('error', serviceError);
      return [];
    }
  }

  /**
   * Get time sessions for a specific time period
   */
  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<TimeSession[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase
        .from('time_sessions')
        .select('*, tasks(title, status, priority, category_name, is_deleted)')
        .eq('user_id', userData.user.id)
        .eq('is_deleted', false) // Filter out soft-deleted sessions
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: false });
        
      if (error) throw error;
      
      // Filter out sessions for deleted tasks
      const filteredData = data?.filter(session => !session.tasks?.is_deleted) as TimeSession[];
      
      this.emit('sessions-loaded', filteredData);
      return filteredData;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.date_range_error');
      this.emit('error', serviceError);
      return [];
    }
  }
  
  /**
   * Get a specific time session by ID
   */
  async getSessionById(id: string): Promise<TimeSession | null> {
    try {
      const { data, error } = await supabase
        .from('time_sessions')
        .select('*, tasks(title, status, priority, category_name, is_deleted)')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();
      
      if (error) throw error;
      
      const session = data as TimeSession;
      return session;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.fetch_error');
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Get the currently active time session (has start_time but no end_time)
   */
  async getActiveSession(): Promise<TimeSession | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('time_sessions')
        .select('*, tasks(title, status, priority, category_name, is_deleted)')
        .eq('user_id', user.user.id)
        .eq('is_deleted', false)
        .is('end_time', null)  // Only sessions without an end_time (still active)
        .order('start_time', { ascending: false })
        .limit(1);  // Get the most recent active session
      
      if (error) throw error;
      
      // Check if we found any active sessions
      if (!data || data.length === 0) return null;
      
      // Check if the associated task is completed - if so, we should auto-close this session
      const session = data[0] as TimeSession;
      if (session.tasks?.status === 'completed') {
        console.log(`Found active session ${session.id} for completed task ${session.task_id}, auto-closing it`);
        // Auto-close the session since the task is completed
        await this.stopSession(session.id);
        
        // Also make sure task status is updated properly 
        await this.updateTaskStatusBasedOnSessions(session.task_id);
        
        return null;
      }
      
      return session;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.fetch_active_error');
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Create a new time session
   */
  async createSession(taskId: string): Promise<TimeSession | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('Authentication required');
      }
      
      const newSession = {
        task_id: taskId,
        user_id: userData.user.id,
        start_time: new Date().toISOString(),
        end_time: null,
        duration: null,
        status: TimeSessionStatus.ACTIVE, // Set initial status
        is_deleted: false
      };
      
      const { data, error } = await supabase
        .from('time_sessions')
        .insert(newSession)
        .select('*')
        .single();
        
      if (error) throw error;
      
      const session = data as TimeSession;
      this.emit('session-created', session);
      this.emit('session-started', session);
      
      // Update task status based on the presence of sessions
      await this.updateTaskStatusBasedOnSessions(taskId);
      
      return session;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.create_error');
      this.emit('error', serviceError);
      return null;
    }
  }
  
  /**
   * Update a time session
   */
  async updateSession(id: string, data: Partial<TimeSession>): Promise<TimeSession | null> {
    try {
      const { data: updatedData, error } = await supabase
        .from('time_sessions')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();
        
      if (error) throw error;
      
      const session = updatedData as TimeSession;
      this.emit('session-updated', session);
      
      return session;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.update_error');
      this.emit('error', serviceError);
      return null;
    }
  }
  
  /**
   * Delete a time session (soft delete)
   */
  async deleteSession(id: string): Promise<boolean> {
    try {
      // First get the session to know which task it belongs to
      const { data: session, error: fetchError } = await supabase
        .from('time_sessions')
        .select('task_id')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const taskId = session?.task_id;
      
      // Then perform soft delete by setting is_deleted flag
      const { error } = await supabase
        .from('time_sessions')
        .update({ is_deleted: true })
        .eq('id', id);
      
      if (error) throw error;
      
      this.emit('session-deleted', id);
      
      // If we have a task ID, update its status based on remaining sessions
      if (taskId) {
        await this.updateTaskStatusBasedOnSessions(taskId);
      }
      
      return true;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.delete_error');
      this.emit('error', serviceError);
      return false;
    }
  }
  
  /**
   * Stop a time session (set end_time and calculate duration)
   */
  async stopSession(id: string): Promise<TimeSession | null> {
    try {
      // First get the session to calculate duration
      const { data: sessionData, error: fetchError } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();
        
      if (fetchError) throw fetchError;
      
      const session = sessionData as TimeSession;
      const startTime = new Date(session.start_time);
      const endTime = new Date();
      
      // Calculate duration in seconds
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Update the session with end time, duration, and completed status
      const updateData = {
        end_time: endTime.toISOString(),
        duration: `${durationSeconds} seconds`,
        status: TimeSessionStatus.COMPLETED
      };
      
      const { data: updatedData, error: updateError } = await supabase
        .from('time_sessions')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
        
      if (updateError) throw updateError;
      
      const updatedSession = updatedData as TimeSession;
      this.emit('session-stopped', updatedSession);
      
      return updatedSession;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.stop_error');
      this.emit('error', serviceError);
      return null;
    }
  }
  
  /**
   * Pause an active time session
   * @param sessionId The ID of the session to pause
   */
  async pauseSession(sessionId: string): Promise<TimeSession | null> {
    try {
      // First check if session exists and is active
      const { data: session, error: fetchError } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!session) throw new Error('Session not found');
      
      if (session.status !== TimeSessionStatus.ACTIVE) {
        throw new Error(`Cannot pause session with status: ${session.status}`);
      }
      
      // Update the session status to paused
      const { data, error } = await supabase
        .from('time_sessions')
        .update({ status: TimeSessionStatus.PAUSED })
        .eq('id', sessionId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      this.emit('session-paused', data);
      
      return data;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.pause_error');
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Resume a paused time session
   * @param sessionId The ID of the session to resume
   */
  async resumeSession(sessionId: string): Promise<TimeSession | null> {
    try {
      // First check if session exists and is paused
      const { data: session, error: fetchError } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!session) throw new Error('Session not found');
      
      if (session.status !== TimeSessionStatus.PAUSED) {
        throw new Error(`Cannot resume session with status: ${session.status}`);
      }
      
      // Update the session status to active
      const { data, error } = await supabase
        .from('time_sessions')
        .update({ status: TimeSessionStatus.ACTIVE })
        .eq('id', sessionId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      this.emit('session-resumed', data);
      
      return data;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.resume_error');
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Cancel an active or paused time session
   * @param sessionId The ID of the session to cancel
   */
  async cancelSession(sessionId: string): Promise<TimeSession | null> {
    try {
      // First check if session exists
      const { data: session, error: fetchError } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!session) throw new Error('Session not found');
      
      if (session.status !== TimeSessionStatus.ACTIVE && 
          session.status !== TimeSessionStatus.PAUSED) {
        throw new Error(`Cannot cancel session with status: ${session.status}`);
      }
      
      // Update the session status to cancelled
      const { data, error } = await supabase
        .from('time_sessions')
        .update({ 
          status: TimeSessionStatus.CANCELLED,
          end_time: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      this.emit('session-cancelled', data);
      
      return data;
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.cancel_error');
      this.emit('error', serviceError);
      return null;
    }
  }

  /**
   * Calculate total time spent on tasks in a given period
   * @param taskIds Optional array of task IDs to filter by
   * @param startDate Optional start date for the period
   * @param endDate Optional end date for the period
   * @returns Total time in minutes
   */
  async calculateTimeSpent(taskIds?: string[], startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('Authentication required');
      }
      
      let query = supabase
        .from('time_sessions')
        .select('duration')
        .eq('user_id', userData.user.id)
        .eq('is_deleted', false)
        .not('duration', 'is', null);
        
      // Apply optional filters
      if (taskIds && taskIds.length > 0) {
        query = query.in('task_id', taskIds);
      }
      
      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('start_time', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Parse the durations and sum them up
      let totalSeconds = 0;
      
      data.forEach(item => {
        if (item.duration) {
          // Parse PostgreSQL interval format "X seconds"
          const match = item.duration.match(/^(\d+) seconds$/);
          if (match && match[1]) {
            totalSeconds += parseInt(match[1], 10);
          }
        }
      });
      
      // Convert seconds to minutes and return
      return Math.round(totalSeconds / 60);
    } catch (error) {
      const serviceError: ServiceError = this.processError(error, 'time_sessions.calculate_time_error');
      this.emit('error', serviceError);
      return 0;
    }
  }

  /**
   * Update task status based on presence of time sessions
   * @private
   */
  private async updateTaskStatusBasedOnSessions(taskId: string): Promise<void> {
    try {
      // First check how many sessions this task has
      const { data: sessions, error: sessionError } = await supabase
        .from('time_sessions')
        .select('id, end_time')
        .eq('task_id', taskId)
        .eq('is_deleted', false);
      
      if (sessionError) throw sessionError;
      
      // Get current task to know its status
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single();
      
      if (taskError) throw taskError;
      if (!task) throw new Error('Task not found');
      
      // Check if any active sessions exist (no end_time)
      const hasActiveSessions = sessions && sessions.some(session => !session.end_time);
      
      // Determine appropriate status
      const hasSessions = sessions && sessions.length > 0;
      const currentStatus = task.status as TaskStatusType;
      const newStatus = determineStatusFromSessions(currentStatus, hasSessions, hasActiveSessions);
      
      // Only update if status needs to change
      if (newStatus !== currentStatus) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', taskId);
        
        if (updateError) throw updateError;
        
        console.log(`Task ${taskId} status updated from ${currentStatus} to ${newStatus} based on sessions`);
      }
    } catch (error) {
      console.error('Error updating task status based on sessions:', error);
      // Don't throw the error - this is a background operation
    }
  }
}

// Create singleton instance
export const timeSessionsService = new TimeSessionsService();
