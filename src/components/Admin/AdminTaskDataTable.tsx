import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Search, ChevronDown, ChevronUp, Filter, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_time: string | null;
  actual_time: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
  list_id: string | null;
  category_name: string | null;
  [key: string]: any; // To allow for dynamic fields
}

export function AdminTaskDataTable() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10); // Default tasks per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all'); // 'all' or 'my'
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // List of all available task fields to display
  const fields = [
    { id: 'id', label: 'ID', display: false },
    { id: 'title', label: 'Title', display: true },
    { id: 'description', label: 'Description', display: false },
    { id: 'status', label: 'Status', display: true },
    { id: 'priority', label: 'Priority', display: true },
    { id: 'due_date', label: 'Due Date', display: true },
    { id: 'estimated_time', label: 'Estimated Time', display: true },
    { id: 'actual_time', label: 'Actual Time', display: true },
    { id: 'tags', label: 'Tags', display: true },
    { id: 'created_at', label: 'Created At', display: true },
    { id: 'updated_at', label: 'Updated At', display: true },
    { id: 'created_by', label: 'Created By', display: false },
    { id: 'is_deleted', label: 'Is Deleted', display: true },
    { id: 'list_id', label: 'List ID', display: false },
    { id: 'category_name', label: 'Category', display: true },
  ];
  
  const [visibleFields, setVisibleFields] = useState(
    fields.filter(field => field.display).map(field => field.id)
  );
  
  // Fetch tasks with pagination, sorting, and filtering
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      let currentUserId: string | null = null;

      // Get user ID only if viewing 'my' tasks
      if (viewMode === 'my') {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          currentUserId = user?.id || null;
          if (!currentUserId) {
            throw new Error('Could not get user ID.');
          }
        } catch (err) {
          console.error("Error getting user ID for 'My Tasks' view:", err);
          setError(err instanceof Error ? err.message : 'Could not verify user.');
          setTasks([]);
          setTotalTasks(0);
          setLoading(false);
          return; // Stop fetching if user ID is required but unavailable
        }
      }
      
      // Calculate range for pagination
      const from = (currentPage - 1) * tasksPerPage;
      const to = from + tasksPerPage - 1;
      
      try {
        let query = supabase
          .from('tasks')
          .select('*', { count: 'exact' }); // Request total count
          //.eq('is_deleted', false); // Assuming we always want non-deleted tasks

        // Conditionally filter by user ID
        if (viewMode === 'my' && currentUserId) {
          query = query.eq('created_by', currentUserId);
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        // Apply search term (across multiple fields)
        if (searchTerm) {
          const searchLower = `%${searchTerm.toLowerCase()}%`;
          query = query.or(
            `title.ilike.${searchLower},description.ilike.${searchLower},category_name.ilike.${searchLower}`
            // Note: Filtering by tags directly in Supabase might require different approach
            // if 'tags' is an array type. For now, searching text fields.
          );
        }
        
        // Apply sorting and pagination
        query = query
          .order(sortField, { ascending: sortDirection === 'asc' })
          .range(from, to);
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        console.log('Tasks loaded:', data ? data.length : 0, 'Total:', count);
        setTasks(data || []);
        setTotalTasks(count || 0);
        
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [viewMode, sortField, sortDirection, currentPage, tasksPerPage, searchTerm, statusFilter]); // Added viewMode dependency
  
  // Derived state for pagination
  const totalPages = Math.ceil(totalTasks / tasksPerPage);
  
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
  
  // Export tasks as CSV
  const exportTasksAsCSV = () => {
    // Create headers based on visible fields
    const headers = fields
      .filter(field => visibleFields.includes(field.id))
      .map(field => field.label);
    
    // Create rows
    const rows = tasks.map(task => {
      return visibleFields.map(fieldId => {
        // Handle special cases
        // TODO: Ensure filteredTasks is replaced by 'tasks' if client-side filtering is fully removed
        if (fieldId === 'tags' && Array.isArray(task[fieldId])) {
          return task[fieldId].join(', ');
        }
        if (fieldId === 'due_date' && task[fieldId]) {
          return new Date(task[fieldId]).toLocaleDateString();
        }
        return task[fieldId] !== null ? task[fieldId] : '';
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
    link.setAttribute('download', `taskman-tasks-${new Date().toISOString().split('T')[0]}.csv`);
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
  const renderCellContent = (task: Task, fieldId: string) => {
    switch (fieldId) {
      case 'tags':
        return Array.isArray(task.tags) 
          ? task.tags.map(tag => (
              <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 rounded mr-1">
                {tag}
              </span>
            ))
          : null;
      case 'due_date':
        return task.due_date 
          ? new Date(task.due_date).toLocaleDateString() 
          : 'No deadline';
      case 'created_at':
      case 'updated_at':
        return formatTime(task[fieldId]);
      case 'is_deleted':
        return task.is_deleted 
          ? <span className="text-red-500">Yes</span> 
          : <span className="text-green-500">No</span>;
      default:
        return task[fieldId] !== null ? task[fieldId] : '—';
    }
  };
  
  // Expand task to show all fields
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-taskman-blue-500" />
        <span className="ml-2">Loading tasks...</span>
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
        <h2 className="text-xl font-semibold text-gray-800">All Tasks</h2>
        <p className="text-sm text-gray-500">Comprehensive view of all tasks in the system</p>
      </div>
      
      {/* Filters and controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search tasks..."
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
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          
          <div className="relative inline-block">
            <button
              className="border rounded-md px-3 py-2 flex items-center gap-1"
              onClick={() => document.getElementById('field-dropdown')?.classList.toggle('hidden')}
            >
              <Filter size={16} />
              <span>Columns</span>
            </button>
            <div
              id="field-dropdown"
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
            onClick={exportTasksAsCSV}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-300 rounded-md p-0.5">
          <button
            onClick={() => setViewMode('all')}
            disabled={viewMode === 'all' || loading}
            className={`px-3 py-1 text-sm rounded-md ${viewMode === 'all' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setViewMode('my')}
            disabled={viewMode === 'my' || loading}
            className={`px-3 py-1 text-sm rounded-md ${viewMode === 'my' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            My Tasks
          </button>
        </div>
      </div>
      
      {/* Table Wrapper for Horizontal Scroll */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
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
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={visibleFields.length + 1} className="px-6 py-4 text-center text-gray-500">
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map(task => (
                <React.Fragment key={task.id}>
                  <tr 
                    className={`hover:bg-gray-50 ${expandedTaskId === task.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedTaskId === task.id 
                          ? <ChevronUp size={16} /> 
                          : <ChevronDown size={16} />}
                      </button>
                    </td>
                    {fields
                      .filter(field => visibleFields.includes(field.id))
                      .map(field => (
                        <td key={field.id} className="px-6 py-4 whitespace-nowrap">
                          {renderCellContent(task, field.id)}
                        </td>
                      ))
                    }
                  </tr>
                  {expandedTaskId === task.id && (
                    <tr>
                      <td colSpan={visibleFields.length + 1} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {fields.map(field => (
                            <div key={field.id} className="mb-2">
                              <div className="text-xs font-medium text-gray-500 uppercase">{field.label}</div>
                              <div className="mt-1">{renderCellContent(task, field.id)}</div>
                            </div>
                          ))}
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
      
      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between px-2">
        <div className="text-sm text-gray-700">
          Showing{' '}
          <span className="font-medium">{(currentPage - 1) * tasksPerPage + 1}</span>
          {' '}to{' '}
          <span className="font-medium">{Math.min(currentPage * tasksPerPage, totalTasks)}</span>
          {' '}of{' '}
          <span className="font-medium">{totalTasks}</span>
          {' '}results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          {/* Optional: Tasks per page selector */}
          <select 
             value={tasksPerPage}
             onChange={(e) => {
               setTasksPerPage(Number(e.target.value));
               setCurrentPage(1); // Reset to page 1 when changing page size
             }}
             disabled={loading}
             className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
           >
             <option value={10}>10 / page</option>
             <option value={25}>25 / page</option>
             <option value={50}>50 / page</option>
             <option value={100}>100 / page</option>
           </select>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
        {tasks.length} tasks found
      </div>
    </div>
  );
}
