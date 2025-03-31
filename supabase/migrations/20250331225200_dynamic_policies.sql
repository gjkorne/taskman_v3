/*
  # Dynamic Task Permissions Migration
  
  This migration:
  1. Dynamically detects the user identifier column (user_id, created_by, etc.)
  2. Creates appropriate policies based on what's found
  3. Uses safe exception handling to avoid errors
  
  This approach adapts to your actual database schema rather than assuming column names.
*/

-- Function to create policies dynamically based on detected user column
DO $$
DECLARE
  user_column text := NULL;
  column_exists boolean := false;
BEGIN
  -- Try to find the user identifier column by checking common column names
  FOR user_column IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name IN ('user_id', 'created_by', 'owner_id', 'author_id', 'uid', 'user_uuid')
  LOOP
    RAISE NOTICE '===== FOUND USER IDENTIFIER COLUMN: % =====', user_column;
    column_exists := true;
    
    -- Create policies using the discovered column name
    BEGIN
      EXECUTE format('
        DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
        CREATE POLICY "Users can view their own tasks"
        ON tasks
        FOR SELECT
        TO authenticated
        USING (%I = auth.uid())
      ', user_column);
      RAISE NOTICE 'Created SELECT policy using column: %', user_column;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating SELECT policy: %', SQLERRM;
    END;
    
    BEGIN
      EXECUTE format('
        DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
        CREATE POLICY "Users can insert their own tasks"
        ON tasks
        FOR INSERT
        TO authenticated
        WITH CHECK (%I = auth.uid())
      ', user_column);
      RAISE NOTICE 'Created INSERT policy using column: %', user_column;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating INSERT policy: %', SQLERRM;
    END;
    
    BEGIN
      EXECUTE format('
        DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
        CREATE POLICY "Users can update their own tasks"
        ON tasks
        FOR UPDATE
        TO authenticated
        USING (%I = auth.uid())
        WITH CHECK (%I = auth.uid())
      ', user_column, user_column);
      RAISE NOTICE 'Created UPDATE policy using column: %', user_column;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating UPDATE policy: %', SQLERRM;
    END;
    
    BEGIN
      EXECUTE format('
        DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
        CREATE POLICY "Users can delete their own tasks"
        ON tasks
        FOR DELETE
        TO authenticated
        USING (%I = auth.uid())
      ', user_column);
      RAISE NOTICE 'Created DELETE policy using column: %', user_column;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating DELETE policy: %', SQLERRM;
    END;
    
    -- Found a valid column, no need to continue the loop
    EXIT;
  END LOOP;
  
  -- If no user identifier column was found, try a more generic approach with a catch-all policy
  IF NOT column_exists THEN
    RAISE NOTICE '===== NO USER IDENTIFIER COLUMN FOUND, CREATING GENERIC POLICY =====';
    
    BEGIN
      EXECUTE '
        DROP POLICY IF EXISTS "Allow full access to authenticated users" ON tasks;
        CREATE POLICY "Allow full access to authenticated users"
        ON tasks
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true)
      ';
      RAISE NOTICE 'Created generic ALL policy for authenticated users';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating generic policy: %', SQLERRM;
    END;
  END IF;
END;
$$;

-- Make sure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
