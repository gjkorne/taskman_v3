/*
  # Check Database Constraints Migration
  This migration inspects the specific constraints on the tasks table
  to understand exactly what values are allowed for the status field.
*/

-- Get all check constraints for the tasks table
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  RAISE NOTICE '===== DATABASE CONSTRAINTS FOR TASKS TABLE =====';
  
  FOR constraint_record IN 
    SELECT conname, pg_get_constraintdef(c.oid) as constraint_def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace s ON t.relnamespace = s.oid
    WHERE t.relname = 'tasks'
    AND s.nspname = 'public'
    AND c.contype = 'c'
  LOOP
    RAISE NOTICE 'Constraint: %, Definition: %', 
      constraint_record.conname, 
      constraint_record.constraint_def;
  END LOOP;
  
  -- Try to find the specific valid_status constraint
  RAISE NOTICE '';
  RAISE NOTICE '===== VALID STATUS CONSTRAINT DETAILS =====';
  FOR constraint_record IN 
    SELECT conname, pg_get_constraintdef(c.oid) as constraint_def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace s ON t.relnamespace = s.oid
    WHERE t.relname = 'tasks'
    AND s.nspname = 'public'
    AND c.contype = 'c'
    AND conname = 'valid_status'
  LOOP
    RAISE NOTICE 'Valid Status Constraint: %', constraint_record.constraint_def;
  END LOOP;
  
  -- Check for any sample tasks that already exist
  RAISE NOTICE '';
  RAISE NOTICE '===== SAMPLE TASK STATUS VALUES =====';
  FOR constraint_record IN 
    SELECT status, COUNT(*) as count
    FROM tasks
    GROUP BY status
  LOOP
    RAISE NOTICE 'Status: %, Count: %', 
      constraint_record.status, 
      constraint_record.count;
  END LOOP;
END;
$$;
