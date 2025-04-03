import React from 'react';
import { Trash, ChevronDown, ChevronUp, Info, Calendar } from 'lucide-react';
import type { TimeSession } from '../../services/api/timeSessionsService';
import { cn } from '../../lib/utils';

interface TimeSessionRowProps {
  session: TimeSession;
  isExpanded: boolean;
  formattedTimes: {
    start: string;
    end: string;
    duration: string;
    relative: string;
  };
  onToggle: (sessionId: string) => void;
  onViewDetails: (sessionId: string, e: React.MouseEvent) => void;
  onDelete: (sessionId: string, e: React.MouseEvent) => void;
}

/**
 * Individual time session row component
 */
export function TimeSessionRow({
  session,
  isExpanded,
  formattedTimes,
  onToggle,
  onViewDetails,
  onDelete
}: TimeSessionRowProps) {
  const { start, end, duration, relative } = formattedTimes;
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
        onClick={() => onToggle(session.id)}
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
              onClick={(e) => onViewDetails(session.id, e)}
              className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
              title="View details"
            >
              <Info className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => onDelete(session.id, e)}
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
        <TimeSessionExpandedDetails 
          start={start}
          end={end}
          duration={duration}
          isActive={!session.end_time}
          sessionId={session.id}
          onDelete={onDelete}
        />
      )}
    </li>
  );
}

interface TimeSessionExpandedDetailsProps {
  start: string;
  end: string;
  duration: string;
  isActive: boolean;
  sessionId: string;
  onDelete: (sessionId: string, e: React.MouseEvent) => void;
}

/**
 * Expanded details section for a time session
 */
function TimeSessionExpandedDetails({
  start,
  end,
  duration,
  isActive,
  sessionId,
  onDelete
}: TimeSessionExpandedDetailsProps) {
  return (
    <div className="px-4 pb-4 text-sm bg-indigo-50">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 mb-1">Start Time:</p>
          <p className="font-medium">{start}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">End Time:</p>
          <p className="font-medium">
            {!isActive ? end : (
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
            {!isActive ? 'Completed' : 'Active'}
          </p>
        </div>
      </div>
      
      {/* Add direct delete button in expanded view for improved UX */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={(e) => onDelete(sessionId, e)}
          className="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded flex items-center"
        >
          <Trash className="h-3 w-3 mr-1" />
          Delete Session
        </button>
      </div>
    </div>
  );
}
