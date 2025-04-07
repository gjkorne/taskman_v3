import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Search, ChevronDown, ChevronUp, Filter, Download } from 'lucide-react';
import { formatDistanceToNow, intervalToDuration } from 'date-fns';

interface TimeSession {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: string | null; 
  created_at: string;
  notes?: string;
  status?: string;
  is_deleted?: boolean;
  // Task information from joins
  tasks?: {
    title?: string;
    status?: string;
    priority?: string;
    category_name?: string;
    is_deleted?: boolean;
  };
  [key: string]: any; // To allow for dynamic fields
}

export function AdminSessionDataTable() {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('start_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  
  // List of all available session fields to display
  const fields = [
    { id: 'id', label: 'ID', display: false },
    { id: 'task_title', label: 'Task', display: true },
    { id: 'start_time', label: 'Start Time', display: true },
    { id: 'end_time', label: 'End Time', display: true },
    { id: 'duration', label: 'Duration', display: true },
    { id: 'status', label: 'Status', display: true },
    { id: 'task_status', label: 'Task Status', display: true },
    { id: 'task_category', label: 'Category', display: true },
    { id: 'notes', label: 'Notes', display: false },
    { id: 'created_at', label: 'Created At', display: false },
    { id: 'is_deleted', label: 'Is Deleted', display: true },
  ];
  
  const [visibleFields, setVisibleFields] = useState(
    fields.filter(field => field.display).map(field => field.id)
  );
  
  // Fetch all sessions with task info
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('time_sessions')
          .select('*, tasks(title, status, priority, category_name, is_deleted)')
          .eq('is_deleted', false)
          .order(sortField, { ascending: sortDirection === 'asc' });
        
        if (error) throw error;
        
        console.log('Time sessions loaded:', data ? data.length : 0);
        
        // Transform data to flatten task info for easier display
        const transformedData = (data || []).map(session => ({
          ...session,
          task_title: session.tasks?.title || 'Unknown Task',
          task_status: session.tasks?.status || 'Unknown',
          task_category: session.tasks?.category_name || 'Uncategorized'
        }));
        
        setSessions(transformedData);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load time sessions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, [sortField, sortDirection]);
  
  // Filter and sort sessions
  const filteredSessions = sessions
    .filter(session => {
      // Skip sessions for deleted tasks
      if (session.tasks?.is_deleted) {
        return false;
      }
      
      // Apply status filter
      if (statusFilter !== 'all' && session.status !== statusFilter) {
        return false;
      }
      
      // Apply search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          session.task_title?.toLowerCase().includes(searchLower) ||
          session.notes?.toLowerCase().includes(searchLower) ||
          session.task_category?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  
  // Toggle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Toggle field visibility
  const toggleFieldVisibility = (fieldId: string) => {
    setVisibleFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };
  
  // Format duration in a human-readable way
  const formatDuration = (durationString: string | null): string => {
    if (!durationString) return '—';
    
    // Try to parse PostgreSQL interval format
    // Example: "3 hours 24 minutes 12 seconds" or "12:34:56"
    try {
      // Check if it's in seconds format (from the database)
      if (durationString.includes('seconds')) {
        const seconds = parseInt(durationString.split(' ')[0]);
        const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
        return `${duration.hours ? duration.hours + 'h ' : ''}${duration.minutes}m ${duration.seconds}s`;
      }
      
      // Parse HH:MM:SS format
      const parts = durationString.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseInt(parts[2]);
        return `${hours ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
      }
      
      return durationString;
    } catch (err) {
      console.error('Error parsing duration:', err);
      return durationString;
    }
  };
  
  // Export sessions as CSV
  const exportSessionsAsCSV = () => {
    // Create headers based on visible fields
    const headers = fields
      .filter(field => visibleFields.includes(field.id))
      .map(field => field.label);
    
    // Create rows
    const rows = filteredSessions.map(session => {
      return visibleFields.map(fieldId => {
        // Handle special cases
        if (fieldId === 'duration') {
          return formatDuration(session.duration);
        }
        if (fieldId === 'start_time' || fieldId === 'end_time') {
          return session[fieldId] ? new Date(session[fieldId]).toLocaleString() : '';
        }
        return session[fieldId] !== null ? session[fieldId] : '';
      });
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `taskman-sessions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format relative time
  const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  // Render cell content based on field type
  const renderCellContent = (session: TimeSession, fieldId: string) => {
    switch (fieldId) {
      case 'start_time':
      case 'end_time':
        return session[fieldId] 
          ? new Date(session[fieldId]).toLocaleString() 
          : fieldId === 'end_time' ? 'In Progress' : '—';
      case 'created_at':
        return formatTime(session.created_at);
      case 'is_deleted':
        return session.is_deleted 
          ? <span className="text-red-500">Yes</span> 
          : <span className="text-green-500">No</span>;
      case 'duration':
        return formatDuration(session.duration);
      case 'status':
        return (
          <span className={`px-2 py-1 text-xs rounded ${
            session.status === 'active' ? 'bg-blue-100 text-blue-800' :
            session.status === 'completed' ? 'bg-green-100 text-green-800' :
            session.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {session.status || 'Unknown'}
          </span>
        );
      case 'task_status':
        return (
          <span className={`px-2 py-1 text-xs rounded ${
            session.task_status === 'active' ? 'bg-blue-100 text-blue-800' :
            session.task_status === 'completed' ? 'bg-green-100 text-green-800' :
            session.task_status === 'pending' ? 'bg-gray-100 text-gray-800' :
            session.task_status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {session.task_status || 'Unknown'}
          </span>
        );
      default:
        return session[fieldId] !== null ? session[fieldId] : '—';
    }
  };
  
  // Expand session to show all fields
  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-taskman-blue-500" />
        <span className="ml-2">Loading time sessions...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded">
        {error}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Time Sessions</h2>
        <p className="text-sm text-gray-500">View of all time tracking sessions in the system</p>
      </div>
      
      {/* Filters and controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search sessions..."
            className="pl-10 pr-4 py-2 border rounded-md w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="border rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <div className="relative inline-block">
            <button
              className="border rounded-md px-3 py-2 flex items-center gap-1"
              onClick={() => document.getElementById('session-field-dropdown')?.classList.toggle('hidden')}
            >
              <Filter size={16} />
              <span>Columns</span>
            </button>
            <div
              id="session-field-dropdown"
              className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg p-2 z-10 hidden"
              style={{ width: '200px' }}
            >
              {fields.map(field => (
                <div key={field.id} className="p-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={visibleFields.includes(field.id)}
                      onChange={() => toggleFieldVisibility(field.id)}
                      className="mr-2"
                    />
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <button
            className="border rounded-md px-3 py-2 flex items-center gap-1 bg-green-50 text-green-700 border-green-200"
            onClick={exportSessionsAsCSV}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                &nbsp;
              </th>
              {fields
                .filter(field => visibleFields.includes(field.id))
                .map(field => (
                  <th 
                    key={field.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort(field.id)}
                  >
                    <div className="flex items-center">
                      {field.label}
                      {sortField === field.id && (
                        sortDirection === 'asc' 
                          ? <ChevronUp size={14} className="ml-1" />
                          : <ChevronDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                ))
              }
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={visibleFields.length + 1} className="px-6 py-4 text-center text-gray-500">
                  No time sessions found.
                </td>
              </tr>
            ) : (
              filteredSessions.map(session => (
                <React.Fragment key={session.id}>
                  <tr className={`hover:bg-gray-50 ${expandedSessionId === session.id ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleSessionExpansion(session.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedSessionId === session.id 
                          ? <ChevronUp size={16} /> 
                          : <ChevronDown size={16} />}
                      </button>
                    </td>
                    {fields
                      .filter(field => visibleFields.includes(field.id))
                      .map(field => (
                        <td key={field.id} className="px-6 py-4 whitespace-nowrap">
                          {renderCellContent(session, field.id)}
                        </td>
                      ))
                    }
                  </tr>
                  {expandedSessionId === session.id && (
                    <tr>
                      <td colSpan={visibleFields.length + 1} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Show all fields in expanded view */}
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">Session ID</div>
                            <div className="mt-1 font-mono text-sm">{session.id}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">Task ID</div>
                            <div className="mt-1 font-mono text-sm">{session.task_id}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">User ID</div>
                            <div className="mt-1 font-mono text-sm">{session.user_id}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">Task</div>
                            <div className="mt-1">{session.task_title}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">Start Time</div>
                            <div className="mt-1">{session.start_time ? new Date(session.start_time).toLocaleString() : '—'}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">End Time</div>
                            <div className="mt-1">{session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress'}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">Duration</div>
                            <div className="mt-1">{formatDuration(session.duration)}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">Status</div>
                            <div className="mt-1">{renderCellContent(session, 'status')}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">Task Status</div>
                            <div className="mt-1">{renderCellContent(session, 'task_status')}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-500 uppercase">Category</div>
                            <div className="mt-1">{session.task_category}</div>
                          </div>
                          <div className="mb-2 col-span-3">
                            <div className="text-xs font-medium text-gray-500 uppercase">Notes</div>
                            <div className="mt-1">{session.notes || 'No notes'}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
        {filteredSessions.length} time sessions found
      </div>
    </div>
  );
}
