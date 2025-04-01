import { supabase } from '../lib/supabase';

/**
 * Reset all task statuses and clear timer storage
 * Use this utility to fix issues with multiple active tasks
 */
export const resetAllTimerState = async () => {
  try {
    console.log('Resetting all timer state...');
    
    // Clear localStorage timer state
    localStorage.removeItem('timerState');
    console.log('Local storage timer state cleared');
    
    // Step 1: Get the current user ID for proper filtering
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user.id;
    
    if (!userId) {
      console.error('No authenticated user found');
      return { success: false, message: 'Authentication required' };
    }
    
    // Step 2: Reset all active or paused tasks to pending status
    try {
      // Get all active and paused tasks first
      const { data: activeTasks, error: queryError } = await supabase
        .from('tasks')
        .select('id')
        .in('status', ['active', 'paused'])
        .eq('created_by', userId);
      
      if (queryError) {
        console.error('Error querying active tasks:', queryError);
        throw queryError;
      }
      
      console.log(`Found ${activeTasks?.length || 0} active or paused tasks`);
      
      // Update each task individually
      let updatedCount = 0;
      if (activeTasks && activeTasks.length > 0) {
        for (const task of activeTasks) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ status: 'pending' })
            .eq('id', task.id)
            .eq('created_by', userId);
          
          if (!updateError) {
            updatedCount++;
          } else {
            console.error(`Error updating task ${task.id}:`, updateError);
          }
        }
      }
      
      console.log(`Successfully reset ${updatedCount} tasks to pending status`);
    } catch (taskError) {
      console.error('Task reset error:', taskError);
      // Continue with session reset even if task reset fails
    }
    
    // Step 3: Close any open sessions
    try {
      // Get all open sessions
      const { data: openSessions, error: sessionQueryError } = await supabase
        .from('task_sessions')
        .select('id')
        .is('end_time', null)
        .eq('created_by', userId);
      
      if (sessionQueryError) {
        console.error('Error querying open sessions:', sessionQueryError);
        throw sessionQueryError;
      }
      
      console.log(`Found ${openSessions?.length || 0} open sessions`);
      
      // Close each session individually
      let closedCount = 0;
      if (openSessions && openSessions.length > 0) {
        for (const session of openSessions) {
          const { error: updateError } = await supabase
            .from('task_sessions')
            .update({ 
              end_time: new Date().toISOString(),
              duration: 0 // We don't know the actual duration, so set to 0
            })
            .eq('id', session.id)
            .eq('created_by', userId);
          
          if (!updateError) {
            closedCount++;
          } else {
            console.error(`Error closing session ${session.id}:`, updateError);
          }
        }
      }
      
      console.log(`Successfully closed ${closedCount} open sessions`);
    } catch (sessionError) {
      console.error('Session reset error:', sessionError);
    }
    
    return { success: true, message: 'Timer state reset successfully' };
  } catch (error) {
    console.error('Reset error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
