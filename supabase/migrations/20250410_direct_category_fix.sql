-- Migration: Direct fix for category field issues
-- Date: 2025-04-10

-- 1. Drop the constraint that enforces specific category names
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category_name;

-- 2. Create a new view that provides category alias access
CREATE OR REPLACE VIEW tasks_with_category AS
SELECT 
    t.*,
    t.category_name AS category  -- Provide an alias for backward compatibility
FROM 
    tasks t;

-- 3. Update the app to use the new view
COMMENT ON VIEW tasks_with_category IS 'Use this view for backward compatibility with code expecting the category field';

-- 4. Add more explanation about the change
COMMENT ON TABLE tasks IS 'Tasks table with category_name as the primary category field (category field has been deprecated)';
COMMENT ON COLUMN tasks.category_name IS 'The category name for the task (replaces the old category field)';

-- 5. Update the RLS policies directly if needed (uncomment if needed)
-- Update any 'update' RLS policies manually:
-- ALTER POLICY policy_name ON tasks USING (created_by = auth.uid()) WITH CHECK (...);

-- 6. Modify task status update procedure if it exists
CREATE OR REPLACE FUNCTION update_task_status(task_id uuid, new_status text)
RETURNS tasks AS $$
DECLARE
    updated_task tasks;
BEGIN
    UPDATE tasks 
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE id = task_id
    RETURNING * INTO updated_task;
    
    RETURN updated_task;
END;
$$ LANGUAGE plpgsql;

-- 7. Modify task creation procedure if it exists
CREATE OR REPLACE FUNCTION create_task(task_data jsonb)
RETURNS tasks AS $$
DECLARE
    new_task tasks;
    category_value text;
BEGIN
    -- Extract category_name from the input data
    category_value := task_data->>'category_name';
    IF category_value IS NULL THEN
        category_value := task_data->>'category';
    END IF;

    -- Use category_name as the actual field
    INSERT INTO tasks (
        title, description, status, priority, 
        due_date, category_name, created_by, tags
    ) VALUES (
        task_data->>'title',
        task_data->>'description',
        COALESCE(task_data->>'status', 'pending'),
        COALESCE(task_data->>'priority', 'medium'),
        (task_data->>'due_date')::timestamptz,
        category_value,
        auth.uid(),
        COALESCE((task_data->'tags')::jsonb, '[]'::jsonb)
    )
    RETURNING * INTO new_task;
    
    RETURN new_task;
END;
$$ LANGUAGE plpgsql;
