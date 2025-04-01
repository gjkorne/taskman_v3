import { resetAllTimerState } from './resetTimerState';

// Make these utilities globally available in development mode
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore - Adding to window object
  window.debugTools = {
    resetAllTimerState,
    
    // View current timer state
    getTimerState: () => {
      try {
        const state = localStorage.getItem('timerState');
        return state ? JSON.parse(state) : null;
      } catch (e) {
        console.error('Error retrieving timer state:', e);
        return null;
      }
    },
    
    // Clear local storage timer data
    clearTimerStorage: () => {
      localStorage.removeItem('timerState');
      console.log('Timer storage cleared');
    }
  };
  
  console.log('Debug tools loaded. Access via window.debugTools');
}
