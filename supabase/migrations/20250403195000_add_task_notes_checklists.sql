/*
  # Task Notes and Checklists Enhancement
  
  This migration updates the tasks table to allow for both notes and checklists
  to be stored simultaneously, rather than one replacing the other.
  
  Changes:
  1. Add a 'notes' JSONB column to store rich text notes
  2. Add a 'checklist_items' JSONB column to store checklist items
  3. Add constraints to ensure proper format
  
  Note: This is designed to be backward compatible with existing data.
*/

-- Check if the notes column already exists (in any form)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'notes') THEN
    -- Add notes column as JSONB to store structured text content
    ALTER TABLE tasks ADD COLUMN notes jsonb;
    COMMENT ON COLUMN tasks.notes IS 'Text notes in rich text format';
  ELSE
    -- Get the data type of the existing notes column
    DECLARE
      column_type text;
    BEGIN
      SELECT data_type INTO column_type FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'notes';
      
      -- If not already JSONB, alter it
      IF column_type <> 'jsonb' THEN
        -- Create a temporary column to hold the converted data
        ALTER TABLE tasks ADD COLUMN notes_temp jsonb;
        
        -- Convert the old data to JSONB format
        UPDATE tasks SET notes_temp = 
          CASE 
            WHEN notes IS NULL THEN NULL
            ELSE jsonb_build_object('format', 'text', 'content', notes)
          END;
        
        -- Drop the old column and rename the new one
        ALTER TABLE tasks DROP COLUMN notes;
        ALTER TABLE tasks RENAME COLUMN notes_temp TO notes;
      END IF;
    END;
  END IF;
END $$;

-- Check if the checklist_items column already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'checklist_items') THEN
    -- Add checklist_items column to store checklist items
    ALTER TABLE tasks ADD COLUMN checklist_items jsonb DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN tasks.checklist_items IS 'Checklist items for the task';
  END IF;
END $$;

-- Add a note_type column to track the primary display mode
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'note_type') THEN
    -- Add note_type column (text, checklist, or both)
    ALTER TABLE tasks ADD COLUMN note_type text DEFAULT 'text';
    COMMENT ON COLUMN tasks.note_type IS 'Primary note display type (text, checklist, or both)';
  END IF;
END $$;

-- Add constraints to validate the format of checklist_items
ALTER TABLE tasks ADD CONSTRAINT checklist_items_is_array
  CHECK (checklist_items IS NULL OR jsonb_typeof(checklist_items) = 'array');

-- Create a function to validate the structure of checklist items
CREATE OR REPLACE FUNCTION validate_checklist_item(item jsonb) 
RETURNS boolean AS $$
BEGIN
  -- Each item should be an object with id, text, completed, and order properties
  RETURN (
    jsonb_typeof(item) = 'object' AND
    item ? 'id' AND 
    item ? 'text' AND 
    item ? 'completed' AND 
    item ? 'order'
  );
END;
$$ LANGUAGE plpgsql;

-- Add an index for better performance when searching notes
CREATE INDEX IF NOT EXISTS tasks_notes_gin_idx ON tasks USING GIN (notes);

-- Create a view that includes task data with both notes and checklist items
CREATE OR REPLACE VIEW task_full_view AS
SELECT 
  t.*,
  CASE 
    WHEN t.notes IS NOT NULL AND t.checklist_items IS NOT NULL AND jsonb_array_length(t.checklist_items) > 0 
    THEN 'both'
    WHEN t.checklist_items IS NOT NULL AND jsonb_array_length(t.checklist_items) > 0 
    THEN 'checklist'
    WHEN t.notes IS NOT NULL 
    THEN 'text'
    ELSE 'none'
  END as content_type
FROM tasks t;
