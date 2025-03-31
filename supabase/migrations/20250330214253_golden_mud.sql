/*
  # Fix tasks table RLS policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate RLS policies with proper permissions
    - Ensure policies handle task assignments correctly

  2. Security
    - Enable RLS on tasks table
    - Policies ensure users can only access their own tasks or tasks assigned to them
    - All operations require authentication
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can view tasks they created or are assigned to" ON tasks;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting tasks
CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

-- Create policy for viewing tasks (includes assigned tasks)
CREATE POLICY "Users can view tasks they created or are assigned to"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM task_assignments 
      WHERE task_assignments.task_id = tasks.id 
      AND task_assignments.user_id = auth.uid()
    )
  );

-- Create policy for updating tasks
CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create policy for deleting tasks
CREATE POLICY "Users can delete their own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());