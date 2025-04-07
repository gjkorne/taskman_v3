import { useState, useEffect } from 'react';
import { AdminTaskDataTable } from '../components/Admin/AdminTaskDataTable';
import { AdminSessionDataTable } from '../components/Admin/AdminSessionDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/UI/Tabs';
import { Database, Clock, Info } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Admin Data View Page
 * 
 * Provides comprehensive data tables for viewing and filtering:
 * - All tasks regardless of status
 * - All time sessions
 * 
 * Features include:
 * - Searchable tables
 * - Customizable columns
 * - CSV export
 * - Detailed data views
 */
export function AdminDataViewPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  
  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_role_assignments')
          .select('user_roles(name)')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.user_roles?.name === 'admin');
        }
      } catch (err) {
        console.error('Error in admin check:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  // Redirect non-admin users to home
  if (!loading && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-taskman-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Data Explorer</h1>
        <p className="text-gray-600">
          View and analyze all tasks and time sessions data in the system. Use the filters and search to find specific records.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tasks" className="flex items-center">
            <Database className="mr-2 h-4 w-4" />
            <span>Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <span>Time Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center">
            <Info className="mr-2 h-4 w-4" />
            <span>Help</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <AdminTaskDataTable />
        </TabsContent>
        
        <TabsContent value="sessions">
          <AdminSessionDataTable />
        </TabsContent>
        
        <TabsContent value="help">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Data Explorer Help</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Tasks Table</h3>
                <p className="text-gray-600 mb-2">
                  The Tasks table shows all tasks in the system, regardless of status. You can:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Search for tasks by title, description, category, or tags</li>
                  <li>Filter by status (pending, active, completed, etc.)</li>
                  <li>Sort by any column by clicking the column header</li>
                  <li>Customize visible columns using the Columns button</li>
                  <li>Export the filtered data as CSV</li>
                  <li>Click the expand button to see full details of a task</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Time Sessions Table</h3>
                <p className="text-gray-600 mb-2">
                  The Time Sessions table shows all time tracking sessions for tasks. You can:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Search for sessions by task name, notes, or category</li>
                  <li>Filter by session status (active, completed, paused, etc.)</li>
                  <li>Sort by any column by clicking the column header</li>
                  <li>Customize visible columns using the Columns button</li>
                  <li>Export the filtered data as CSV</li>
                  <li>Click the expand button to see full details of a session</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Data Privacy Note</h3>
                <p className="text-gray-600">
                  As an admin, you have access to view all task and session data in the system. 
                  Please respect user privacy and only use this data for legitimate administrative purposes.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDataViewPage;
