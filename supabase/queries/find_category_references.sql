-- 1. Query to find triggers that reference "category" field on the tasks table
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'tasks'::regclass
    AND pg_get_triggerdef(oid) ILIKE '%category%';

-- 2. Query to find RLS policies on tasks table that reference "category"
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    tablename = 'tasks'
    AND (
        qual::text ILIKE '%category%' 
        OR with_check::text ILIKE '%category%'
    );

-- 3. Query to find the valid_category_name constraint or any constraints referencing category
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'tasks'::regclass
    AND (
        conname = 'valid_category_name'
        OR pg_get_constraintdef(oid) ILIKE '%category%'
    );

-- 4. Check for before/after update triggers specifically
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    CASE
        WHEN tgtype & 2 > 0 THEN 'BEFORE'
        WHEN tgtype & 16 > 0 THEN 'AFTER'
        ELSE 'UNKNOWN'
    END AS timing,
    CASE
        WHEN tgtype & 8 > 0 THEN true
        ELSE false
    END AS for_update,
    pg_get_triggerdef(oid) AS trigger_definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'tasks'::regclass
    AND tgtype & 8 > 0 -- for UPDATE triggers
    AND pg_get_triggerdef(oid) ILIKE '%category%';

-- 5. Check for custom functions referenced by triggers that might use "category"
WITH trigger_functions AS (
    SELECT 
        tgfoid AS function_oid
    FROM 
        pg_trigger
    WHERE 
        tgrelid = 'tasks'::regclass
)
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM 
    pg_proc p
JOIN 
    trigger_functions tf ON p.oid = tf.function_oid
WHERE 
    pg_get_functiondef(p.oid) ILIKE '%category%';

-- 6. Look for any views that might reference the tasks table and the category field
SELECT 
    c.relname AS view_name,
    pg_get_viewdef(c.oid) AS view_definition
FROM 
    pg_class c
JOIN 
    pg_namespace n ON c.relnamespace = n.oid
WHERE 
    c.relkind = 'v'
    AND pg_get_viewdef(c.oid) ILIKE '%tasks%'
    AND pg_get_viewdef(c.oid) ILIKE '%category%';
