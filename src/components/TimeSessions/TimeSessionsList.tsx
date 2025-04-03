import { useState } from 'react';
import { Clock, Calendar, Trash, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { TimeSession } from '../../services/api/timeSessionsService';
import { useTimeSessions } from '../../hooks/useTimeSessions';
import { TimeSessionDetails } from './TimeSessionDetails';
import { cn } from '../../lib/utils';

interface TimeSessionsListProps {
  taskId?: string;
  compact?: boolean;
  limit?: number;
  className?: string;
  onSessionsLoaded?: (totalTime: string) => void;
}

export function TimeSessionsList({
  taskId,
  compact = false,
  limit,
  className,
  onSessionsLoaded
}: TimeSessionsListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { 
    sessions, 
    isLoading, 
    error, 
    formatSessionTime, 
    totalTime,
    deleteSession,
    refreshSessions
  } = useTimeSessions(taskId);

  // Explicitly type the sessions to use the TimeSession type
  const typedSessions: TimeSession[] = sessions;

  // Notify parent component when sessions are loaded
  if (typedSessions.length > 0 && onSessionsLoaded) {
    onSessionsLoaded(totalTime);
  }

  // Handle session toggle
  const toggleSession = (sessionId: string) => {
    setExpanded(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // Handle viewing session details
  const viewSessionDetails = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSessionId(sessionId);
  };

  // Close session details modal
  const closeSessionDetails = () => {
    setSelectedSessionId(null);
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Delete button clicked for session:', sessionId);
    
    if (window.confirm('Are you sure you want to delete this time session?')) {
      try {
        console.log('Confirming deletion for session:', sessionId);
        const success = await deleteSession(sessionId);
        
        if (success) {
          console.log('Session deleted successfully');
          // Force close expanded state for deleted session
          setExpanded(prev => {
            const newState = {...prev};
            delete newState[sessionId];
            return newState;
          });
        } else {
          console.error('Failed to delete session');
          alert('Failed to delete the session. Please try again.');
        }
      } catch (error) {
        console.error('Error during session deletion:', error);
        alert('An error occurred while deleting the session.');
      }
    }
  };

  // Filter sessions if limit is provided
  const displaySessions = limit ? typedSessions.slice(0, limit) : typedSessions;

  if (isLoading) {
    return (
      <div className={cn("flex justify-center py-4", className)}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-blue-200 rounded-full mb-2"></div>
          <div className="h-3 w-24 bg-blue-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 bg-red-50 text-red-700 rounded-md", className)}>
        <p>Error loading time sessions: {error.message}</p>
      </div>
    );
  }

  if (displaySessions.length === 0) {
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>
        <Clock className="mx-auto h-12 w-12 text-gray-300 mb-2" />
        <p>No time sessions recorded yet.</p>
      </div>
    );
  }

  // Compact view for embedded usage
  if (compact) {
    return (
      <div className={cn("border rounded-md", className)}>
        <div className="bg-gray-50 p-3 border-b font-medium flex justify-between items-center">
          <span>Time Sessions</span>
          <span className="text-indigo-600">{totalTime} total</span>
        </div>
        <ul className="divide-y">
          {displaySessions.map(session => {
            const { start, end, duration, relative } = formatSessionTime(session);
            return (
              <li 
                key={session.id} 
                className="p-2 text-sm hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleSession(session.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 text-gray-400 mr-1" />
                    <span>{start}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-indigo-600 font-medium">{duration}</span>
                    <button
                      onClick={(e) => viewSessionDetails(session.id, e)}
                      className="text-gray-400 hover:text-indigo-600"
                      title="View details"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete session"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {expanded[session.id] && (
                  <div className="mt-2 pl-4 text-xs text-gray-500">
                    {end && <div>Ended: {end} ({relative})</div>}
                    {!end && <div className="text-green-600">In progress</div>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {limit && typedSessions.length > limit && (
          <div className="p-2 text-center text-indigo-600 text-sm">
            {typedSessions.length - limit} more sessions not shown
          </div>
        )}
        
        {/* Session details modal */}
        {selectedSessionId && (
          <TimeSessionDetails 
            sessionId={selectedSessionId}
            onClose={closeSessionDetails}
            onSessionUpdated={refreshSessions}
            onSessionDeleted={refreshSessions}
          />
        )}
      </div>
    );
  }

  // Full view for dedicated pages
  return (
    <div className={cn("", className)}>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Time Sessions</h3>
      </div>
      
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Column Headers */}
        <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 border-b text-sm font-medium text-gray-600">
          <div>Time & Date</div>
          <div>Task</div>
          <div>Duration</div>
          <div className="text-right">Actions</div>
        </div>
        
        <ul className="divide-y">
          {displaySessions.map(session => {
            const { start, end, duration, relative } = formatSessionTime(session);
            const isExpanded = expanded[session.id];
            const taskName = session.tasks?.title || 'Unknown Task';
            const taskCategory = session.tasks?.category_name || '';
            
            return (
              <li 
                key={session.id} 
                className={cn(
                  "transition-colors", 
                  isExpanded ? "bg-indigo-50" : "hover:bg-gray-50"
                )}
              >
                <div 
                  className="grid grid-cols-4 gap-4 p-4 cursor-pointer"
                  onClick={() => toggleSession(session.id)}
                >
                  {/* Time & Date Column */}
                  <div className="flex flex-col">
                    <div className="flex items-center text-gray-800">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">{start}</span>
                    </div>
                    {!isExpanded && end && (
                      <div className="mt-1 text-sm text-gray-500">
                        {end} ({relative})
                      </div>
                    )}
                    {!isExpanded && !session.end_time && (
                      <div className="mt-1 text-sm text-green-600 font-medium">
                        In progress ({relative})
                      </div>
                    )}
                  </div>
                  
                  {/* Task Column */}
                  <div className="flex flex-col justify-center">
                    <div className="font-medium text-gray-800 truncate">
                      {taskName}
                    </div>
                    {taskCategory && (
                      <div className="text-xs mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {taskCategory}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Duration Column */}
                  <div className="flex items-center">
                    <span className="text-lg font-medium text-indigo-600">
                      {session.end_time ? duration : 'Active'}
                    </span>
                  </div>
                  
                  {/* Actions Column */}
                  <div className="flex items-center justify-end space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => viewSessionDetails(session.id, e)}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
                        title="View details"
                      >
                        <Info className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                        title="Delete session"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Expand"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 text-sm bg-indigo-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 mb-1">Start Time:</p>
                        <p className="font-medium">{start}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">End Time:</p>
                        <p className="font-medium">
                          {session.end_time ? end : (
                            <span className="text-green-600">In progress</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Duration:</p>
                        <p className="font-medium text-indigo-600">{duration}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Status:</p>
                        <p className="font-medium">
                          {session.end_time ? 'Completed' : 'Active'}
                        </p>
                      </div>
                    </div>
                    {/* Add direct delete button in expanded view for improved UX */}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded flex items-center"
                      >
                        <Trash className="h-3 w-3 mr-1" />
                        Delete Session
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        
        {/* Session details modal */}
        {selectedSessionId && (
          <TimeSessionDetails 
            sessionId={selectedSessionId}
            onClose={closeSessionDetails}
            onSessionUpdated={refreshSessions}
            onSessionDeleted={refreshSessions}
          />
        )}
      </div>
    </div>
  );
}
