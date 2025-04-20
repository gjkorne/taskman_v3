import { supabase } from '../lib/supabase';

/**
 * Diagnostic function to test task creation with minimal data
 * Run this from browser console with:
 * import('../utils/diagnose-task-creation').then(m => m.diagnoseTaskCreation())
 */
export async function diagnoseTaskCreation() {
  try {
    console.log('==========================================');
    console.log('STARTING TASK CREATION DIAGNOSTIC TESTS');
    console.log('==========================================');

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }

    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }

    console.log('✅ Authenticated as user:', user.id);

    // 2. Try different combinations of task data

    // Test 1: Just title
    await testTaskCreation({
      title: 'Test Task - Title Only ' + Date.now(),
    });

    // Test 2: Title and status
    await testTaskCreation({
      title: 'Test Task - Title+Status ' + Date.now(),
      status: 'active',
    });

    // Test 3: Title, status, priority
    await testTaskCreation({
      title: 'Test Task - Title+Status+Priority ' + Date.now(),
      status: 'active',
      priority: 'medium',
    });

    // Test 4: All required fields based on schema
    await testTaskCreation({
      title: 'Test Task - All Required ' + Date.now(),
      status: 'active',
      priority: 'medium',
      created_by: user.id,
    });

    // Test if read works (bypassing insert)
    console.log('Testing read operation...');
    const { data: readData, error: readError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);

    if (readError) {
      console.error('❌ Read operation failed:', readError);
    } else {
      console.log('✅ Read operation successful:', readData);
    }

    console.log('==========================================');
    console.log('DIAGNOSTIC TESTS COMPLETED');
    console.log('==========================================');
  } catch (error) {
    console.error('❌ Unexpected error during diagnosis:', error);
  }
}

/**
 * Helper function to test task creation with different data
 */
async function testTaskCreation(taskData: any) {
  console.log('-----------------------------------------');
  console.log('Testing task creation with:', taskData);

  try {
    const { data, error } = await supabase.from('tasks').insert([taskData]);

    if (error) {
      console.error(`❌ Insert failed for task "${taskData.title}":`, error);
      return false;
    }

    console.log(`✅ Successfully created task "${taskData.title}":`, data);
    return true;
  } catch (e) {
    console.error(`❌ Exception when creating task "${taskData.title}":`, e);
    return false;
  }
}
