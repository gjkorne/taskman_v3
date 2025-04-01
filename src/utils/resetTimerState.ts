import { supabase } from '../lib/supabase';

/**
 * Reset all task activity states and clear timer storage
 * Use this utility to fix issues with multiple active tasks
 */
export const resetAllTimerState = async () => {
  try {
    console.log('Resetting all timer state...');
    
    // Clear localStorage timer state
    localStorage.removeItem('timerState');
    
    // Reset all tasks to idle activity state
    const { error: taskError, count } = await supabase
      .from('tasks')
      .update({ 
        activity_state: 'idle' 
      })
      .in('activity_state', ['in_progress', 'paused']);
    
    if (taskError) {
      console.error('Error resetting task activity states:', taskError);
      throw taskError;
    }
    
    console.log(`Reset ${count} tasks to idle activity state`);
    
    // Close any open sessions
    const { data: openSessions, error: sessionQueryError } = await supabase
      .from('task_sessions')
      .select('id')
      .is('end_time', null);
    
    if (sessionQueryError) {
      console.error('Error finding open sessions:', sessionQueryError);
      throw sessionQueryError;
    }
    
    if (openSessions.length > 0) {
      const sessionIds = openSessions.map(s => s.id);
      
      // Close open sessions with the current time
      const { error: sessionUpdateError } = await supabase
        .from('task_sessions')
        .update({ 
          end_time: new Date().toISOString() 
        })
        .in('id', sessionIds);
      
      if (sessionUpdateError) {
        console.error('Error closing open sessions:', sessionUpdateError);
        throw sessionUpdateError;
      }
      
      console.log(`Closed ${openSessions.length} open sessions`);
    } else {
      console.log('No open sessions found');
    }
    
    return { success: true, message: 'Timer state reset successfully' };
  } catch (error) {
    console.error('Error in resetAllTimerState:', error);
    return { success: false, message: 'Failed to reset timer state', error };
  }
};
