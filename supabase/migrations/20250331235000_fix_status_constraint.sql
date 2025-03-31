/*
  # Fix Status Constraint Migration
  
  This migration:
  1. Identifies the allowed values for the status field
  2. Either adjusts or drops the constraint to fix task creation
*/

-- First, examine the constraint definition
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
  
  RAISE NOTICE 'Valid Status Constraint: %', constraint_def;
END $$;

-- Drop and recreate the constraint with values that include 'active'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_status;

-- Recreate with a more permissive set of allowed values
ALTER TABLE tasks ADD CONSTRAINT valid_status 
  CHECK (status IN ('active', 'completed', 'archived', 'pending', 'in_progress', 'ACTIVE', 
                   'COMPLETED', 'ARCHIVED', 'PENDING', 'IN_PROGRESS'));

-- Fix RLS policy recursion issue by temporarily disabling RLS and recreating policies
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON tasks;

-- Create simplified policies
CREATE POLICY "Users can create and manage their own tasks"
ON tasks
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Re-enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
