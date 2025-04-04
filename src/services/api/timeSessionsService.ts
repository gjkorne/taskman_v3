import { supabase } from '../../lib/supabase';

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
 */
export class TimeSessionsService {
  /**
   * Get all time sessions for a specific task
   */
  async getSessionsByTaskId(taskId: string) {
    const { data, error } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('task_id', taskId)
      .order('start_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching time sessions:', error);
      throw error;
    }
    
    return data as TimeSession[];
  }

  /**
   * Get all time sessions for the current user
   */
  async getUserSessions() {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      console.error('No authenticated user found');
      throw new Error('Authentication required');
    }
    
    const { data, error } = await supabase
      .from('time_sessions')
      .select('*, tasks(title, status, priority, category_name, is_deleted)')
      .eq('user_id', userData.user.id)
      .eq('is_deleted', false) // Filter out soft-deleted sessions
      .order('start_time', { ascending: false });
      
    if (error) {
      console.error('Error fetching user time sessions:', error);
      throw error;
    }
    
    // Filter out sessions for deleted tasks
    const filteredData = data?.filter(session => !session.tasks?.is_deleted);
    
    return filteredData;
  }

  /**
   * Get time sessions for a specific time period
   */
  async getSessionsByDateRange(startDate: Date, endDate: Date) {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      console.error('No authenticated user found');
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
      
    if (error) {
      console.error('Error fetching time sessions by date range:', error);
      throw error;
    }
    
    // Filter out sessions for deleted tasks
    const filteredData = data?.filter(session => !session.tasks?.is_deleted);
    
    return filteredData;
  }
  
  /**
   * Get a specific time session by ID
   */
  async getSessionById(sessionId: string) {
    const { data, error } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    return { data, error };
  }

  /**
   * Update an existing time session
   */
  async updateSession(sessionId: string, updates: Partial<TimeSession>) {
    const { data, error } = await supabase
      .from('time_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    return { data, error };
  }

  /**
   * Delete a time session by ID
   */
  async deleteSession(sessionId: string) {
    console.log(`Attempting to soft delete session with ID: ${sessionId}`);
    
    if (!sessionId) {
      console.error('Invalid session ID for deletion');
      return false;
    }
    
    try {
      // Implement soft delete by updating is_deleted flag instead of physically deleting
      const { error } = await supabase
        .from('time_sessions')
        .update({ is_deleted: true })
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error soft-deleting time session:', error);
        throw error;
      }
      
      console.log(`Successfully soft-deleted session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Exception during session deletion:', error);
      throw error;
    }
  }
  
  /**
   * Get summary statistics for time sessions
   */
  async getTimeStats(userId?: string, days = 30) {
    // Default to current user if no userId is provided
    const { data: userData } = await supabase.auth.getUser();
    const targetUserId = userId || userData.user?.id;
    
    if (!targetUserId) {
      console.error('No user ID provided or authenticated');
      throw new Error('User ID required');
    }
    
    // Calculate the start date (default to last 30 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('time_sessions')
      .select(`
        id,
        duration,
        start_time,
        end_time,
        tasks (
          id,
          title,
          status,
          priority,
          category_name
        )
      `)
      .eq('user_id', targetUserId)
      .eq('is_deleted', false) // Filter out soft-deleted sessions
      .gte('start_time', startDate.toISOString());
      
    if (error) {
      console.error('Error fetching time statistics:', error);
      throw error;
    }
    
    return data;
  }
}

// Create singleton instance
export const timeSessionsService = new TimeSessionsService();
