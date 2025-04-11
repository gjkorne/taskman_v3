-- Migration: Fix category field references
-- Date: 2025-04-10

-- 1. First, drop the constraint if it exists
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category_name;

-- 2. Directly add a category column for backward compatibility
-- This is simpler than trying to create complex triggers
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR 
  GENERATED ALWAYS AS (category_name) STORED;

-- 3. Update the views to use the proper field names
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
    END AS content_type
FROM 
    tasks t;

-- 4. Update the category migration helper view
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

-- 5. Add a comment documenting the change
COMMENT ON COLUMN tasks.category IS 'Generated column for backward compatibility with the old category field';
COMMENT ON COLUMN tasks.category_name IS 'Primary column for storing category names';
