import { supabase } from '../../lib/supabase';
import { BaseService, ServiceError } from '../BaseService';
import { ITimeSessionService, TimeSessionEvents } from '../interfaces/ITimeSessionService';

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
      
      // Return the first active session or null if none found
      return (data && data.length > 0) ? data[0] as TimeSession : null;
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
      // Soft delete - update is_deleted flag instead of removing
      const { error } = await supabase
        .from('time_sessions')
        .update({ is_deleted: true })
        .eq('id', id);
        
      if (error) throw error;
      
      this.emit('session-deleted', id);
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
      
      // Update the session with end time and duration
      const updateData = {
        end_time: endTime.toISOString(),
        duration: `${durationSeconds} seconds`
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
}

// Create singleton instance
export const timeSessionsService = new TimeSessionsService();
