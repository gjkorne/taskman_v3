/*
  # EMERGENCY FIX: DISABLE RLS TEMPORARILY
  This is a temporary fix to allow task creation while we resolve the RLS policy issues.
  
  WARNING: THIS DISABLES SECURITY CONTROLS ON YOUR TASKS TABLE.
  Re-enable RLS with proper policies once task creation is verified to work.
*/

-- Disable Row Level Security temporarily to stop the recursion error
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean the slate
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON tasks;
DROP POLICY IF EXISTS "Users can create and manage their own tasks" ON tasks;

-- Log the current status constraint for reference
DO $$
DECLARE
  constraint_def text;
BEGIN
  SELECT pg_get_constraintdef(c.oid) INTO constraint_def
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace s ON t.relnamespace = s.oid
  WHERE t.relname = 'tasks'
  AND s.nspname = 'public'
  AND c.contype = 'c'
  AND c.conname = 'valid_status';
  
  RAISE NOTICE 'Current Valid Status Constraint: %', constraint_def;
END $$;
