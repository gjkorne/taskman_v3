-- Migration: Fix category reference in triggers and policies
-- Date: 2025-04-10

-- First, let's check for row-level security policies that reference 'category'
DO $$
DECLARE
    policy_record RECORD;
    updated_definition TEXT;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename, definition 
        FROM pg_policies 
        WHERE tablename = 'tasks'
        AND definition::text LIKE '%category%'
        AND definition::text NOT LIKE '%category_name%'
    LOOP
        RAISE NOTICE 'Found policy % on table % with category reference', 
            policy_record.policyname, 
            policy_record.tablename;
    END LOOP;
END $$;

-- Now let's check for and fix any triggers that might reference the old field
DO $$
DECLARE
    trigger_rec RECORD;
    trigger_function_name TEXT;
    trigger_function_body TEXT;
    updated_function_body TEXT;
BEGIN
    -- Look for triggers on the tasks table
    FOR trigger_rec IN
        SELECT 
            tgname AS trigger_name,
            tgfoid::regproc AS function_name
        FROM 
            pg_trigger
        WHERE 
            tgrelid = 'tasks'::regclass
            AND tgtype & 8 > 0 -- UPDATE triggers
    LOOP
        trigger_function_name := trigger_rec.function_name::text;
        
        -- Get the function body
        SELECT prosrc INTO trigger_function_body
        FROM pg_proc
        WHERE proname = trigger_function_name::text::name;
        
        -- Check if the function body references 'category' but not 'category_name'
        IF trigger_function_body LIKE '%NEW.category%' AND trigger_function_body NOT LIKE '%NEW.category_name%' THEN
            RAISE NOTICE 'Found trigger function % with NEW.category reference', trigger_function_name;
            
            -- Update the function to use category_name instead
            updated_function_body := replace(trigger_function_body, 'NEW.category', 'NEW.category_name');
            
            -- Create replacement function with dynamically generated SQL
            EXECUTE 'CREATE OR REPLACE FUNCTION ' || trigger_function_name || '() RETURNS trigger AS $trigfunc$'
                || updated_function_body
                || '$trigfunc$ LANGUAGE plpgsql;';
            
            RAISE NOTICE 'Updated trigger function % to use category_name instead of category', trigger_function_name;
        END IF;
    END LOOP;
END $$;

-- Now fix the valid_category_name constraint if it exists
DO $$
BEGIN
    -- Check if the constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tasks' AND constraint_name = 'valid_category_name'
    ) THEN
        -- Drop the constraint since we're using user-defined categories now
        ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category_name;
        RAISE NOTICE 'Dropped valid_category_name constraint to allow user-defined categories';
    END IF;
END $$;

-- Final step: Add a column alias to maintain backward compatibility if needed
DO $$
BEGIN
    -- Check if we can safely add a column alias
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'category_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'category'
    ) THEN
        -- Create a function for the compatibility trigger
        EXECUTE $FUNC$
        CREATE OR REPLACE FUNCTION tasks_provide_category_alias()
        RETURNS TRIGGER AS $$
        BEGIN
            -- On read operations, provide category_name value as category
            NEW.category := NEW.category_name;
            
            -- For update operations, map category to category_name
            IF TG_OP = 'UPDATE' AND NEW.category IS NOT NULL THEN
                NEW.category_name := NEW.category;
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        $FUNC$;

        -- Drop the trigger if it already exists
        DROP TRIGGER IF EXISTS tasks_category_alias_trigger ON tasks;
        
        -- Create the trigger
        CREATE TRIGGER tasks_category_alias_trigger
        BEFORE INSERT OR UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION tasks_provide_category_alias();
        
        RAISE NOTICE 'Added compatibility trigger to map between category and category_name';
    END IF;
END $$;

-- Update the views to ensure they're compatible with the changes
CREATE OR REPLACE VIEW task_full_view AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.estimated_time,
    t.actual_time,
    t.tags,
    t.created_at,
    t.updated_at,
    t.created_by,
    t.is_deleted,
    t.list_id,
    t.nlp_tokens,
    t.extracted_entities,
    t.embedding_data,
    t.confidence_score,
    t.processing_metadata,
    t.category_name,
    t.category_id,
    t.notes,
    t.checklist_items,
    t.note_type,
    CASE
        WHEN (t.notes IS NOT NULL) AND (t.checklist_items IS NOT NULL) AND (jsonb_array_length(t.checklist_items) > 0) THEN 'both'::text
        WHEN (t.checklist_items IS NOT NULL) AND (jsonb_array_length(t.checklist_items) > 0) THEN 'checklist'::text
        WHEN t.notes IS NOT NULL THEN 'text'::text
        ELSE 'none'::text
    END AS content_type,
    t.category_name AS category -- Add an alias for backward compatibility
FROM 
    tasks t;

-- Update the category migration helper view if needed
CREATE OR REPLACE VIEW category_migration_helper AS
SELECT 
    t.id AS task_id,
    t.created_by AS user_id,
    t.category_name AS task_category_name,
    c.id AS category_id,
    c.name AS category_name
FROM 
    tasks t
LEFT JOIN 
    categories c ON (lower(t.category_name) = lower(c.name)) AND (t.created_by = c.user_id)
WHERE 
    (t.category_id IS NULL) AND (t.category_name IS NOT NULL);
