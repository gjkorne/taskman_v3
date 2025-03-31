import { supabase } from '../../lib/supabase';

export function TaskDebug() {
  const runDiagnostic = async () => {
    console.log('------ TASK CREATION DIAGNOSTIC START ------');
    
    try {
      // Check authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const { session } = sessionData;
      
      if (!session) {
        console.error('❌ No active session - user not authenticated');
        return;
      }
      
      console.log('✅ User authenticated with ID:', session.user.id);
      
      // First check which statuses might be allowed
      console.log('\nTesting status values for constraint compatibility...');
      const statusesToTry = ['pending', 'in_progress', 'completed', 'archived', 'ACTIVE', 'PENDING'];
      
      for (const status of statusesToTry) {
        // Create minimal test task with this status
        const testTask = {
          title: `Test task with status: ${status}`,
          status: status,
          priority: 'medium',
          created_by: session.user.id
        };
        
        console.log(`\nTrying status: "${status}"`);
        
        const { data, error } = await supabase
          .from('tasks')
          .insert([testTask])
          .select();
        
        if (error) {
          console.error(`❌ Failed with status "${status}":`, error.message);
        } else {
          console.log(`✅ SUCCESS with status "${status}"!`, data);
          break; // Found a working status, stop trying others
        }
      }
    } catch (err) {
      console.error('❌ Diagnostic error:', err);
    }
    
    console.log('------ TASK CREATION DIAGNOSTIC END ------');
  };
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-2">Task Creation Diagnostic</h3>
      <p className="mb-2">Click the button below to run a diagnostic test for task creation:</p>
      <button 
        onClick={runDiagnostic}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Run Diagnostic
      </button>
    </div>
  );
}
