-- Migration: Task Status Model Standardization
-- Description: Formalizes the task status model and adds performance improvements

-- First, check and drop any existing constraints on the status column
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_status;

-- Update in_progress status to paused to match our new model
UPDATE tasks
SET status = 'paused'
WHERE status = 'in_progress';

-- Ensure all status values conform to our expected values
UPDATE tasks
SET status = 'pending'
WHERE status NOT IN ('pending', 'active', 'paused', 'completed', 'archived');

-- Create a new constraint to validate status values
ALTER TABLE tasks ADD CONSTRAINT valid_status 
  CHECK (status IN ('pending', 'active', 'paused', 'completed', 'archived'));

-- Add index on status for performance if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_tasks_status'
    ) THEN
        CREATE INDEX idx_tasks_status ON tasks(status);
    END IF;
END$$;

-- Add index on task/user combination for faster queries if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_tasks_user_status'
    ) THEN
        CREATE INDEX idx_tasks_user_status ON tasks(created_by, status);
    END IF;
END$$;

-- Create or update RLS policies for tasks
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tasks_policy') THEN
        ALTER POLICY tasks_policy ON tasks 
        USING (created_by = auth.uid());
    ELSE
        CREATE POLICY tasks_policy ON tasks
        FOR ALL
        USING (created_by = auth.uid());
    END IF;
END$$;
