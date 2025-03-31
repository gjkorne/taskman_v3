/*
  # Restore Row-Level Security with Proper Policies
  
  This migration:
  1. Ensures the status constraint works properly
  2. Re-enables RLS with non-recursive policies
  3. Creates appropriate permissions for users to access their own tasks
*/

-- First fix the status constraint to ensure it includes common values
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE tasks ADD CONSTRAINT valid_status 
  CHECK (status IN ('active', 'completed', 'archived', 'pending', 'in_progress'));

-- Clear out any remaining policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON tasks;
DROP POLICY IF EXISTS "Users can create and manage their own tasks" ON tasks;

-- Create a single properly designed policy for all operations
CREATE POLICY "Users can manage their own tasks"
ON tasks
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Re-enable RLS now that proper policies are in place
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Row-Level Security restored with proper policies';
END $$;
