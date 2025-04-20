import { supabase } from '../lib/supabase';

/**
 * Diagnose authentication and row-level security issues
 */
export async function diagnoseAuth() {
  console.log('------ AUTH DIAGNOSTIC START ------');
  try {
    // 1. Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log(
      '🔑 Authentication status:',
      user ? 'Authenticated' : 'Not authenticated'
    );

    if (!user) {
      console.error('❌ User not authenticated - must log in first');
      return;
    }

    console.log('👤 User ID:', user.id);

    // 2. Test if RLS allows reading tasks
    console.log('\nTesting read access to tasks table...');
    const { data, error: readError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);

    if (readError) {
      console.error('❌ Cannot read tasks:', readError.message);
    } else {
      console.log(
        '✅ Can read tasks table',
        data?.length ? `(${data.length} tasks found)` : '(no tasks found)'
      );
    }

    // 3. Test minimal task creation
    console.log('\nTesting minimal task creation...');
    const minimalTask = {
      title: 'Test task from diagnostic',
      status: 'active',
      priority: 'medium',
      created_by: user.id,
    };

    console.log('Task data:', minimalTask);

    const { data: newTask, error: createError } = await supabase
      .from('tasks')
      .insert([minimalTask])
      .select();

    if (createError) {
      console.error('❌ Task creation failed:', createError);
      console.log('Error code:', createError.code);
      console.log('Error message:', createError.message);
      console.log('Error details:', createError.details);
    } else {
      console.log('✅ Task created successfully:', newTask);
    }
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
  console.log('------ AUTH DIAGNOSTIC END ------');
}
