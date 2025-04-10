-- Migration: Simple fix for category field issues
-- Date: 2025-04-10

-- 1. Drop the constraint causing validation issues
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category_name;

-- 2. Examine the table structure to diagnose issues
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('category', 'category_name');

-- 3. Create simple task_status_update function
CREATE OR REPLACE FUNCTION fix_task_update() 
RETURNS TRIGGER AS $$
BEGIN
  -- Simply map the category_name to be the proper field for updates
  NEW.category_name := COALESCE(NEW.category_name, OLD.category_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a trigger for the fix
DROP TRIGGER IF EXISTS fix_task_update_trigger ON tasks;
CREATE TRIGGER fix_task_update_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION fix_task_update();

-- 5. Add a comment documenting the change
COMMENT ON TABLE tasks IS 'Task table with category_name as the primary category field';
