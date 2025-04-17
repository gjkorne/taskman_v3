-- Fix missing tasks in the remote database
-- This script will create tasks that exist locally but not in the remote database

-- First, let's create a function to insert missing tasks
CREATE OR REPLACE FUNCTION insert_missing_task(
    p_id UUID,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'pending',
    p_priority TEXT DEFAULT 'medium',
    p_category_name TEXT DEFAULT NULL,
    p_due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Only insert if the task doesn't exist
    IF NOT EXISTS (SELECT 1 FROM tasks WHERE id = p_id) THEN
        -- Get category_id if category_name is provided
        DECLARE
            v_category_id UUID := NULL;
        BEGIN
            IF p_category_name IS NOT NULL THEN
                SELECT id INTO v_category_id
                FROM categories
                WHERE LOWER(name) = LOWER(p_category_name)
                LIMIT 1;
                
                -- If category doesn't exist, create it
                IF v_category_id IS NULL THEN
                    INSERT INTO categories (name, user_id, created_at)
                    VALUES (p_category_name, p_created_by, NOW())
                    RETURNING id INTO v_category_id;
                END IF;
            END IF;
            
            -- Insert the task
            INSERT INTO tasks (
                id, 
                title, 
                description, 
                status, 
                priority, 
                category_name, 
                category_id,
                due_date, 
                created_by,
                created_at,
                updated_at
            )
            VALUES (
                p_id,
                p_title,
                p_description,
                p_status,
                p_priority,
                p_category_name,
                v_category_id,
                p_due_date,
                p_created_by,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Created missing task: % (ID: %)', p_title, p_id;
        END;
    ELSE
        RAISE NOTICE 'Task already exists: %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Now insert the specific missing tasks
SELECT insert_missing_task(
    '0536bdaa-ad5a-4810-8714-586682c0584a'::UUID,
    'Task that exists locally but not remotely',
    'This task was created locally and needs to be synced to the remote database',
    'pending',
    'medium',
    'Uncategorized'
);

SELECT insert_missing_task(
    'a5025216-d445-4324-a69e-4b3c532a7651'::UUID,
    'Another local task',
    'Another task that exists locally but not remotely',
    'pending',
    'medium',
    'Uncategorized'
);

SELECT insert_missing_task(
    'fcf7258f-4d0f-45e9-bdcb-353d050fbda5'::UUID,
    'Third local task',
    'Third task that exists locally but not remotely',
    'pending',
    'medium',
    'Uncategorized'
);

-- Report how many tasks were created
DO $$
DECLARE
    task_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO task_count
    FROM tasks
    WHERE id IN (
        '0536bdaa-ad5a-4810-8714-586682c0584a',
        'a5025216-d445-4324-a69e-4b3c532a7651',
        'fcf7258f-4d0f-45e9-bdcb-353d050fbda5'
    );
    
    RAISE NOTICE 'Number of specified tasks now in database: %', task_count;
END;
$$;
