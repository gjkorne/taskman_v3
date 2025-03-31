/*
  # Database Inspection Migration
  This migration is for diagnostic purposes only, to understand the actual structure
  of the tasks table in the database.
  
  NOTE: This migration only outputs information, it doesn't change any data.
*/

-- Create a function to inspect the column names of the tasks table
DO $$
DECLARE
  column_record RECORD;
BEGIN
  RAISE NOTICE '===== INSPECTION: TASKS TABLE COLUMNS =====';
  
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: %, Type: %, Nullable: %', 
      column_record.column_name, 
      column_record.data_type,
      column_record.is_nullable;
  END LOOP;
END;
$$;

-- Now let's see what policies exist on the tasks table
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '===== INSPECTION: TASKS TABLE POLICIES =====';
  
  FOR policy_record IN 
    SELECT policyname, permissive, cmd
    FROM pg_policies
    WHERE tablename = 'tasks'
    AND schemaname = 'public'
  LOOP
    RAISE NOTICE 'Policy: %, Type: %, Command: %', 
      policy_record.policyname, 
      policy_record.permissive,
      policy_record.cmd;
  END LOOP;
END;
$$;
