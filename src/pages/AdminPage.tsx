import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCcw, Clock, Database, XCircle } from 'lucide-react';
import { resetAllTimerState } from '../utils/resetTimerState';
import { supabase } from '../lib/supabase';

interface AdminAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  dangerLevel: 'low' | 'medium' | 'high';
  action: () => Promise<any>;
}

export default function AdminPage() {
  const [actionStatus, setActionStatus] = useState<{
    id: string;
    status: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Define admin actions
  const adminActions: AdminAction[] = [
    {
      id: 'reset-timer-state',
      title: 'Reset Timer State',
      description: 'Reset all timer state, set all task activity states to "idle", and close any open sessions.',
      icon: <Clock size={24} />,
      dangerLevel: 'medium',
      action: async () => {
        const result = await resetAllTimerState();
        return result;
      }
    },
    {
      id: 'clear-timer-storage',
      title: 'Clear Timer Storage',
      description: 'Clear timer state from local storage only. Does not affect database.',
      icon: <XCircle size={24} />,
      dangerLevel: 'low',
      action: async () => {
        localStorage.removeItem('timerState');
        return { success: true, message: 'Timer storage cleared' };
      }
    },
    {
      id: 'show-timer-state',
      title: 'View Current Timer State',
      description: 'Display the current timer state from local storage.',
      icon: <Database size={24} />,
      dangerLevel: 'low',
      action: async () => {
        const state = localStorage.getItem('timerState');
        if (!state) {
          return { success: true, message: 'No timer state found', data: null };
        }
        return { success: true, message: 'Timer state retrieved', data: JSON.parse(state) };
      }
    },
    {
      id: 'check-active-tasks',
      title: 'Check Active Tasks',
      description: 'Show all tasks with "in_progress" or "paused" activity state.',
      icon: <RefreshCcw size={24} />,
      dangerLevel: 'low',
      action: async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .in('activity_state', ['in_progress', 'paused']);
        
        if (error) throw error;
        
        return { 
          success: true, 
          message: `Found ${data.length} active tasks`, 
          data
        };
      }
    }
  ];

  // Handle action execution
  const executeAction = async (action: AdminAction) => {
    setIsLoading(action.id);
    setActionStatus(null);
    
    try {
      const result = await action.action();
      console.log(`Action ${action.title} result:`, result);
      
      setActionStatus({
        id: action.id,
        status: result.success ? 'success' : 'error',
        message: result.message || (result.success ? 'Action completed successfully' : 'Action failed')
      });
      
      // If there's data to display, show it in the console
      if (result.data) {
        console.log('Result data:', result.data);
      }
    } catch (error) {
      console.error(`Error executing ${action.title}:`, error);
      setActionStatus({
        id: action.id,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(null);
    }
  };

  // Get status color class
  const getStatusColorClass = (dangerLevel: AdminAction['dangerLevel']) => {
    switch (dangerLevel) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-amber-500 mr-2" />
          <h2 className="text-2xl font-semibold text-gray-800">Admin Tools</h2>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <p className="text-amber-800">
            These tools are for system administration and debugging purposes only. 
            Use with caution as some actions may affect application data.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminActions.map((action) => (
            <div 
              key={action.id}
              className={`border rounded-lg p-4 ${
                actionStatus?.id === action.id
                  ? actionStatus.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  : getStatusColorClass(action.dangerLevel)
              }`}
            >
              <div className="flex items-center mb-2">
                <div className="mr-2">{action.icon}</div>
                <h3 className="font-medium">{action.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={() => executeAction(action)}
                  disabled={isLoading !== null}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center
                    ${action.dangerLevel === 'high' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : action.dangerLevel === 'medium'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } transition-colors`}
                >
                  {isLoading === action.id ? (
                    <span className="mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {isLoading === action.id ? 'Processing...' : 'Execute'}
                </button>
                
                {actionStatus?.id === action.id && (
                  <div className="flex items-center text-sm">
                    {actionStatus.status === 'success' ? (
                      <CheckCircle size={16} className="text-green-500 mr-1" />
                    ) : (
                      <XCircle size={16} className="text-red-500 mr-1" />
                    )}
                    <span className={actionStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                      {actionStatus.message}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Console Output</h3>
        <p className="text-gray-600">
          Some actions will log additional information to the browser console. 
          Press F12 or right-click and select "Inspect" to view the console output.
        </p>
      </div>
    </div>
  );
}
