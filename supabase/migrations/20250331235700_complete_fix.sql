/*
  # COMPLETE FIX FOR TASK TABLE
  
  This migration performs a comprehensive repair:
  1. Completely disables RLS
  2. Drops ALL policies without exception
  3. Removes and recreates the status constraint
  4. Creates a single, simple policy
  5. Re-enables RLS with the new policy
*/

-- Step 1: Disable RLS completely
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies on the tasks table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'tasks' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tasks', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 3: Fix the status constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE tasks ADD CONSTRAINT valid_status 
  CHECK (status IN ('active', 'completed', 'archived', 'pending', 'in_progress'));

-- Step 4: Create a single, simple policy that won't cause recursion
CREATE POLICY "tasks_simple_policy"
ON tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (created_by = auth.uid());

-- Step 5: Re-enable RLS with new policy
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Task table completely fixed with new simplified security policy';
END $$;
