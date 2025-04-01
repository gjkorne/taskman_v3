/*
  # Add String-Based Category to Tasks Table
  
  This migration:
  1. Adds a new text-based category column
  2. Creates constraints to ensure valid category values
*/

-- Add category_name column
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS category_name text;

-- Add check constraint for valid categories
ALTER TABLE tasks
ADD CONSTRAINT valid_category_name CHECK (
  category_name IS NULL OR 
  category_name IN ('work', 'personal', 'childcare')
);

-- Update schema version
COMMENT ON TABLE tasks IS 'Task management table with string categories';
