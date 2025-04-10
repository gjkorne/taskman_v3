-- Minimal fix for the record "new" has no field "category" error
-- Date: 2025-04-10

-- 1. Drop the constraint that enforces specific category names
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category_name;

-- 2. Add category column if it doesn't exist (as a fallback for compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'category'
    ) THEN
        ALTER TABLE tasks ADD COLUMN category TEXT GENERATED ALWAYS AS (category_name) STORED;
    END IF;
END $$;

-- 3. Check if there are any triggers using NEW.category and show them
SELECT 
    t.tgname AS trigger_name,
    pgt.tgrelid::regclass AS table_name,
    pg_get_triggerdef(pgt.oid) AS trigger_definition
FROM 
    pg_trigger pgt
JOIN 
    pg_proc p ON pgt.tgfoid = p.oid
CROSS JOIN
    LATERAL (SELECT pgt.tgname, p.prosrc) t
WHERE 
    pgt.tgrelid = 'tasks'::regclass
    AND p.prosrc LIKE '%NEW.category%';
