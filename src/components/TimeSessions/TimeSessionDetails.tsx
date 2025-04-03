import { useState, useEffect } from 'react';
import { X, Calendar, Clock, PenTool, Tag, Check, StopCircle, Trash } from 'lucide-react';
import { format } from 'date-fns';
import type { TimeSession } from '../../services/api/timeSessionsService';
import { timeSessionsService } from '../../services/api/timeSessionsService';
import { taskService } from '../../services/api/taskService';
import { cn } from '../../lib/utils';
import { Task, TaskStatus } from '../../types/task';

interface TimeSessionDetailsProps {
  sessionId: string;
  onClose: () => void;
  onSessionUpdated?: () => void;
  onSessionDeleted?: () => void;
}

export function TimeSessionDetails({ 
  sessionId, 
  onClose,
  onSessionUpdated,
  onSessionDeleted
}: TimeSessionDetailsProps) {
  const [session, setSession] = useState<TimeSession | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await timeSessionsService.getSessionById(sessionId);
        
        if (error) throw error;
        if (!data) throw new Error('Session not found');
        
        setSession(data);
        
        // Fetch associated task
        if (data.task_id) {
          const { data: taskData, error: taskError } = await taskService.getTaskById(data.task_id);
          
          if (!taskError && taskData) {
            setTask(taskData);
          }
        }
        
        // Set notes
        setNotes(data.notes || '');
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError('Failed to load session details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessionData();
  }, [sessionId]);

  // Calculate session duration
  const formatDuration = (startTime?: string, endTime?: string | null) => {
    if (!startTime) return '0m';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!session) return;
    
    setIsSaving(true);
    
    try {
      await timeSessionsService.updateSession(sessionId, { notes });
      setIsEditing(false);
      if (onSessionUpdated) onSessionUpdated();
    } catch (err) {
      console.error('Error saving notes:', err);
      setError('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  // End an active session
  const handleEndSession = async () => {
    if (!session || session.end_time) return;
    
    setIsEnding(true);
    
    try {
      // Update session with current time as end_time
      const endTime = new Date().toISOString();
      const { data, error } = await timeSessionsService.updateSession(sessionId, { 
        end_time: endTime
      });
      
      if (error) throw error;
      
      // Update local state
      if (data) {
        setSession({
          ...session,
          end_time: endTime
        });
      }
      
      if (onSessionUpdated) onSessionUpdated();
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
    } finally {
      setIsEnding(false);
    }
  };

  // Delete the session
  const handleDeleteSession = async () => {
    if (!session) return;
    
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await timeSessionsService.deleteSession(sessionId);
      if (onSessionDeleted) onSessionDeleted();
      onClose();
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session');
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto animate-fadeIn">
          <div className="p-6 flex justify-center items-center">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium">Session Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-700">{error || 'Session not found'}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto animate-fadeIn">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium">Session Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Session Information */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center text-indigo-600">
                <Clock className="h-5 w-5 mr-2" />
                <h3 className="text-lg font-medium">Time Session</h3>
              </div>
              <div className="mt-2 md:mt-0 flex space-x-2">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  session.end_time ? "bg-indigo-100 text-indigo-800" : "bg-green-100 text-green-800"
                )}>
                  {session.end_time ? 'Completed' : 'In Progress'}
                </span>
                
                {!session.end_time && (
                  <button
                    onClick={handleEndSession}
                    disabled={isEnding}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center",
                      isEnding && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isEnding ? (
                      <span>Ending...</span>
                    ) : (
                      <>
                        <StopCircle className="h-3 w-3 mr-1" />
                        End Session
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Start Time</div>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{session.start_time ? format(new Date(session.start_time), 'MMM d, yyyy h:mm a') : 'N/A'}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">End Time</div>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{session.end_time ? format(new Date(session.end_time), 'MMM d, yyyy h:mm a') : 'In progress'}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Duration</div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="font-medium">{formatDuration(session.start_time, session.end_time)}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Session ID</div>
                <div className="flex items-center mt-1">
                  <Tag className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-xs font-mono truncate">{session.id}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Associated Task */}
          {task && (
            <div className="border-t pt-6">
              <h3 className="text-md font-medium mb-3">Associated Task</h3>
              <div className="bg-white border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {task.description || 'No description'}
                    </p>
                  </div>
                  <div>
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      task.status === TaskStatus.ACTIVE && "bg-green-100 text-green-800",
                      task.status === TaskStatus.COMPLETED && "bg-blue-100 text-blue-800",
                      task.status === TaskStatus.PENDING && "bg-gray-100 text-gray-800"
                    )}>
                      {task.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Session Notes */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium">Session Notes</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
              >
                <PenTool className="h-3 w-3 mr-1" />
                {isEditing ? 'Cancel' : 'Edit Notes'}
              </button>
            </div>
            
            {isEditing ? (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter session notes here..."
                  className="w-full border rounded-md p-3 h-32 resize-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                  >
                    {isSaving ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving
                      </span>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Save Notes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-md p-4 min-h-[100px]">
                {notes ? (
                  <p className="whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-gray-400 italic">No notes for this session</p>
                )}
              </div>
            )}
          </div>
          
          {/* Delete session button */}
          <div className="border-t pt-6">
            <button
              onClick={handleDeleteSession}
              disabled={isDeleting}
              className={cn(
                "w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md",
                isDeleting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
