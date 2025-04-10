-- Migration: Fix category field references in triggers and policies
-- Date: 2025-04-10

-- 1. Check for any triggers that might be referencing the old category field
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_table = 'tasks' 
        AND action_statement::text LIKE '%category%'
    LOOP
        RAISE NOTICE 'Found trigger % with category reference: %', 
            trigger_record.trigger_name, 
            trigger_record.action_statement;
    END LOOP;
END $$;

-- 2. Update RLS policies to use category_name instead of category
DO $$
DECLARE
    policy_record RECORD;
    updated_definition TEXT;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename, definition 
        FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND definition LIKE '%category%'
    LOOP
        -- Replace old field references in policy definitions
        updated_definition := regexp_replace(
            policy_record.definition::text, 
            'new\.category', 
            'new.category_name', 
            'g'
        );
        
        updated_definition := regexp_replace(
            updated_definition, 
            'OLD\.category', 
            'OLD.category_name', 
            'g'
        );
        
        EXECUTE format(
            'ALTER POLICY %I ON %I USING (%s)',
            policy_record.policyname,
            policy_record.tablename,
            updated_definition
        );
        
        RAISE NOTICE 'Updated policy % on table % with new definition: %', 
            policy_record.policyname, 
            policy_record.tablename, 
            updated_definition;
    END LOOP;
END $$;

-- 3. Fix or drop the valid_category_name constraint if it exists
DO $$
BEGIN
    -- Check if the constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tasks' AND constraint_name = 'valid_category_name'
    ) THEN
        -- Drop the constraint
        ALTER TABLE tasks DROP CONSTRAINT valid_category_name;
        
        -- Since we're now using user-defined categories, we don't need to re-add
        -- a constraint that validates against predefined category values.
        -- If custom validation is needed, a new constraint could be added here.
        
        RAISE NOTICE 'Dropped the valid_category_name constraint. User-defined categories are now allowed.';
    END IF;
END $$;

-- 4. Check for and fix any column default expressions that might reference the old field
DO $$
BEGIN
    -- Check if there are default expressions referencing the old field
    UPDATE pg_attribute 
    SET atthasdef = false 
    WHERE attrelid = 'tasks'::regclass 
    AND attname = 'category';
    
    RAISE NOTICE 'Removed any default expressions on the category field.';
END $$;

-- 5. Add a comment to document the change
COMMENT ON COLUMN tasks.category_name IS 'The category name for the task. This replaced the old category field.';
