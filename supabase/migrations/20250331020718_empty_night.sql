/*
  # Fix Task List RLS Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with optimized access checks
    - Fix infinite recursion in member management policy
    - Add security definer function for member checks

  2. Security
    - Maintain same security level
    - Prevent policy recursion
    - Keep all existing access controls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "List owners can manage members" ON task_list_members;
DROP POLICY IF EXISTS "Users can view their task lists" ON task_lists;

-- Create security definer function to check membership
CREATE OR REPLACE FUNCTION check_task_list_access(list_id uuid, user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM task_lists
    WHERE task_lists.id = list_id
    AND (
      task_lists.owner_id = user_id
      OR EXISTS (
        SELECT 1 FROM task_list_members
        WHERE task_list_members.list_id = list_id
        AND task_list_members.user_id = user_id
      )
    )
  );
END;
$$;

-- Recreate task lists view policy
CREATE POLICY "Users can view their task lists"
  ON task_lists
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM task_list_members
      WHERE task_list_members.list_id = task_lists.id
      AND task_list_members.user_id = auth.uid()
    )
  );

-- Recreate member management policy using security definer function
CREATE POLICY "List owners can manage members"
  ON task_list_members
  FOR ALL
  TO authenticated
  USING (
    check_task_list_access(list_id, auth.uid())
  );