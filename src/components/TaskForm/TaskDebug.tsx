import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function TaskDebug() {
  const [isVisible, setIsVisible] = useState(false);

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
      const statusesToTry = [
        'pending',
        'in_progress',
        'completed',
        'archived',
        'ACTIVE',
        'PENDING',
      ];

      for (const status of statusesToTry) {
        // Create minimal test task with this status
        const testTask = {
          title: `Test task with status: ${status}`,
          status: status,
          priority: 'medium',
          created_by: session.user.id,
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
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center border-b border-gray-200 text-left"
      >
        <span className="font-medium text-gray-700">
          Task Creation Diagnostic
        </span>
        {isVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Collapsible content */}
      {isVisible && (
        <div className="p-4 bg-gray-100">
          <p className="mb-2">
            Click the button below to run a diagnostic test for task creation:
          </p>
          <button
            onClick={runDiagnostic}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Run Diagnostic
          </button>
        </div>
      )}
    </div>
  );
}
