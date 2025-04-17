-- Migration: Fix missing tasks and ensure proper category mapping
-- This migration addresses two issues:
-- 1. Tasks that exist locally but not in the remote database
-- 2. Inconsistencies between category_name and category_id fields

-- First, let's ensure all categories in tasks have corresponding entries in the categories table
DO $$
DECLARE
    category_name_var TEXT;
    category_id_var UUID;
    user_id_var UUID;
BEGIN
    -- For each unique category_name in tasks that doesn't exist in categories
    FOR category_name_var IN 
        SELECT DISTINCT LOWER(t.category_name) 
        FROM tasks t
        WHERE t.category_name IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM categories c 
            WHERE LOWER(c.name) = LOWER(t.category_name)
        )
    LOOP
        -- Get a user_id (using the first task with this category)
        SELECT created_by INTO user_id_var 
        FROM tasks 
        WHERE LOWER(category_name) = LOWER(category_name_var) 
        AND created_by IS NOT NULL 
        LIMIT 1;
        
        -- If no user_id found, use a default admin user
        IF user_id_var IS NULL THEN
            SELECT id INTO user_id_var FROM auth.users LIMIT 1;
        END IF;
        
        -- Create the missing category
        INSERT INTO categories (name, user_id, created_at)
        VALUES (
            -- Use the original case from the first task with this category
            (SELECT category_name FROM tasks WHERE LOWER(category_name) = LOWER(category_name_var) LIMIT 1),
            user_id_var,
            NOW()
        )
        RETURNING id INTO category_id_var;
        
        RAISE NOTICE 'Created missing category: % with ID: %', category_name_var, category_id_var;
    END LOOP;
END;
$$;

-- Now, update all tasks to ensure they have the correct category_id based on their category_name
UPDATE tasks
SET category_id = c.id
FROM categories c
WHERE LOWER(tasks.category_name) = LOWER(c.name)
AND (tasks.category_id IS NULL OR tasks.category_id != c.id);

-- Log how many tasks were updated
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM tasks t
    JOIN categories c ON LOWER(t.category_name) = LOWER(c.name)
    WHERE t.category_id = c.id;
    
    RAISE NOTICE 'Updated category_id for % tasks', updated_count;
END;
$$;

-- Create a function to ensure category_id is always set based on category_name
CREATE OR REPLACE FUNCTION set_category_id_from_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If category_name is updated, find the corresponding category_id
    IF NEW.category_name IS NOT NULL THEN
        SELECT id INTO NEW.category_id
        FROM categories
        WHERE LOWER(name) = LOWER(NEW.category_name)
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS ensure_category_id_set ON tasks;
CREATE TRIGGER ensure_category_id_set
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_category_id_from_name();

-- Add an index to speed up category name lookups (case insensitive)
CREATE INDEX IF NOT EXISTS idx_categories_name_lower ON categories (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_tasks_category_name_lower ON tasks (LOWER(category_name));
