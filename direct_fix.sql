-- Direct fix for missing tasks
-- Run this directly in the Supabase SQL Editor

-- First, get a valid user ID to use for the tasks
DO $$
DECLARE
    valid_user_id UUID;
BEGIN
    -- Get the first user ID from the auth.users table
    SELECT id INTO valid_user_id FROM auth.users LIMIT 1;
    
    -- Insert task 1 if it doesn't exist
    INSERT INTO tasks (
        id, 
        title, 
        description, 
        status, 
        priority, 
        category_name,
        category_id,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        '0536bdaa-ad5a-4810-8714-586682c0584a'::UUID,
        'Task that exists locally but not remotely',
        'This task was created locally and needs to be synced to the remote database',
        'pending',
        'medium',
        'Uncategorized',
        (SELECT id FROM categories WHERE LOWER(name) = 'uncategorized' LIMIT 1),
        valid_user_id,
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM tasks WHERE id = '0536bdaa-ad5a-4810-8714-586682c0584a'
    );

    -- Insert task 2 if it doesn't exist
    INSERT INTO tasks (
        id, 
        title, 
        description, 
        status, 
        priority, 
        category_name, 
        category_id,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        'a5025216-d445-4324-a69e-4b3c532a7651'::UUID,
        'Another local task',
        'Another task that exists locally but not remotely',
        'pending',
        'medium',
        'Uncategorized',
        (SELECT id FROM categories WHERE LOWER(name) = 'uncategorized' LIMIT 1),
        valid_user_id,
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM tasks WHERE id = 'a5025216-d445-4324-a69e-4b3c532a7651'
    );

    -- Insert task 3 if it doesn't exist
    INSERT INTO tasks (
        id, 
        title, 
        description, 
        status, 
        priority, 
        category_name, 
        category_id,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        'fcf7258f-4d0f-45e9-bdcb-353d050fbda5'::UUID,
        'Third local task',
        'Third task that exists locally but not remotely',
        'pending',
        'medium',
        'Uncategorized',
        (SELECT id FROM categories WHERE LOWER(name) = 'uncategorized' LIMIT 1),
        valid_user_id,
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM tasks WHERE id = 'fcf7258f-4d0f-45e9-bdcb-353d050fbda5'
    );
    
    -- Report how many tasks were created
    RAISE NOTICE 'Tasks created with user ID: %', valid_user_id;
END;
$$;
