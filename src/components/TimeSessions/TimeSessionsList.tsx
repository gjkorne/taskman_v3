import { useState } from 'react';
import { Clock, Calendar, Trash, ChevronDown, ChevronUp, Info } from 'lucide-react';
// Import type interface instead of the actual TimeSession export
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

  // Notify parent component when sessions are loaded
  if (sessions.length > 0 && onSessionsLoaded) {
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
    
    if (window.confirm('Are you sure you want to delete this time session?')) {
      await deleteSession(sessionId);
    }
  };

  // Filter sessions if limit is provided
  const displaySessions = limit ? sessions.slice(0, limit) : sessions;

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
        {limit && sessions.length > limit && (
          <div className="p-2 text-center text-indigo-600 text-sm">
            {sessions.length - limit} more sessions not shown
          </div>
        )}
        
        {/* Session details modal */}
        {selectedSessionId && (
          <TimeSessionDetails 
            sessionId={selectedSessionId}
            onClose={closeSessionDetails}
            onSessionUpdated={refreshSessions}
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
        <span className="text-indigo-600 font-medium">{totalTime} total</span>
      </div>
      
      <div className="bg-white border rounded-lg overflow-hidden">
        <ul className="divide-y">
          {displaySessions.map(session => {
            const { start, end, duration, relative } = formatSessionTime(session);
            const isExpanded = expanded[session.id];
            
            return (
              <li 
                key={session.id} 
                className={cn(
                  "transition-colors", 
                  isExpanded ? "bg-indigo-50" : "hover:bg-gray-50"
                )}
              >
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer"
                  onClick={() => toggleSession(session.id)}
                >
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
                    {!isExpanded && !end && (
                      <div className="mt-1 text-sm text-green-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>In progress</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium text-indigo-600">{duration}</span>
                    
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
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-4 pb-4 text-sm">
                    <div className="bg-white rounded-md border p-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-gray-500 mb-1">Start Time</div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          <span>{start}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">End Time</div>
                        <div className="flex items-center">
                          {end ? (
                            <>
                              <Clock className="h-3 w-3 mr-1 text-gray-400" />
                              <span>{end}</span>
                            </>
                          ) : (
                            <span className="text-green-600">In progress</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Session details modal */}
      {selectedSessionId && (
        <TimeSessionDetails 
          sessionId={selectedSessionId}
          onClose={closeSessionDetails}
          onSessionUpdated={refreshSessions}
        />
      )}
    </div>
  );
}
