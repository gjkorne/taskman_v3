import { useState, useEffect } from 'react';
import type { TimeSession } from '../../services/api/timeSessionsService';
import { useTimeSessions } from '../../hooks/useTimeSessions';
import { TimeSessionDetails } from './TimeSessionDetails';
import { TimeSessionRow } from './TimeSessionRow';
import { cn } from '../../lib/utils';

interface TimeSessionsListProps {
  taskId?: string;
  compact?: boolean;
  limit?: number;
  className?: string;
  onSessionsLoaded?: (totalTime: string) => void;
  onSessionDeleted?: () => void;
}

/**
 * List of time sessions with expandable details
 */
export function TimeSessionsList({
  taskId,
  compact = false,
  limit,
  className,
  onSessionsLoaded,
  onSessionDeleted,
}: TimeSessionsListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const {
    sessions,
    isLoading,
    error,
    formatSessionTime,
    totalTime,
    deleteSession,
    refreshSessions,
  } = useTimeSessions(taskId);

  // Explicitly type the sessions to use the TimeSession type
  const typedSessions: TimeSession[] = sessions;

  // Notify parent component when sessions are loaded (only when sessions or totalTime changes)
  useEffect(() => {
    if (typedSessions.length > 0 && onSessionsLoaded) {
      onSessionsLoaded(totalTime);
    }
  }, [typedSessions.length, totalTime, onSessionsLoaded]);

  // Handle session toggle
  const toggleSession = (sessionId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
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
  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
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
          setExpanded((prev) => {
            const newState = { ...prev };
            delete newState[sessionId];
            return newState;
          });

          // Notify parent component about deletion
          if (onSessionDeleted) {
            onSessionDeleted();
          }
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
      <div className={cn('flex justify-center py-4', className)}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-blue-200 rounded-full mb-2"></div>
          <div className="h-3 w-24 bg-blue-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>Error loading time sessions: {error.message}</p>
          <button
            onClick={refreshSessions}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md text-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (typedSessions.length === 0) {
    return (
      <div className={cn('p-6 text-center text-gray-500', className)}>
        <p>
          {compact
            ? 'No time sessions found.'
            : 'No time sessions found for this period.'}
        </p>
      </div>
    );
  }

  // Compact view for embedding
  if (compact) {
    return (
      <div className={cn('', className)}>
        <ul className="divide-y">
          {displaySessions.map((session) => {
            const formattedTimes = formatSessionTime(session);
            const isExpanded = expanded[session.id];

            return (
              <TimeSessionRow
                key={session.id}
                session={session}
                isExpanded={isExpanded}
                formattedTimes={formattedTimes}
                onToggle={toggleSession}
                onViewDetails={viewSessionDetails}
                onDelete={handleDeleteSession}
              />
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
    <div className={cn('', className)}>
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
          {displaySessions.map((session) => {
            const formattedTimes = formatSessionTime(session);
            const isExpanded = expanded[session.id];

            return (
              <TimeSessionRow
                key={session.id}
                session={session}
                isExpanded={isExpanded}
                formattedTimes={formattedTimes}
                onToggle={toggleSession}
                onViewDetails={viewSessionDetails}
                onDelete={handleDeleteSession}
              />
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
