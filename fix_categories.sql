-- Fix missing tasks and ensure proper category mapping
-- This script can be run directly without using the migration system

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

-- Check if the trigger already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'ensure_category_id_set'
    ) THEN
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

        -- Create the trigger
        CREATE TRIGGER ensure_category_id_set
        BEFORE INSERT OR UPDATE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION set_category_id_from_name();
        
        RAISE NOTICE 'Created trigger ensure_category_id_set';
    ELSE
        RAISE NOTICE 'Trigger ensure_category_id_set already exists';
    END IF;
END;
$$;

-- Add indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_categories_name_lower'
    ) THEN
        CREATE INDEX idx_categories_name_lower ON categories (LOWER(name));
        RAISE NOTICE 'Created index idx_categories_name_lower';
    ELSE
        RAISE NOTICE 'Index idx_categories_name_lower already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_tasks_category_name_lower'
    ) THEN
        CREATE INDEX idx_tasks_category_name_lower ON tasks (LOWER(category_name));
        RAISE NOTICE 'Created index idx_tasks_category_name_lower';
    ELSE
        RAISE NOTICE 'Index idx_tasks_category_name_lower already exists';
    END IF;
END;
$$;
