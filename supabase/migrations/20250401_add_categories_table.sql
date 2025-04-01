-- Create a new table for user-defined categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  color TEXT,
  icon TEXT,
  subcategories TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Add a unique constraint on user_id and name
  UNIQUE(user_id, name)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own categories
CREATE POLICY "Users can view their own categories" 
  ON categories FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own categories
CREATE POLICY "Users can create their own categories" 
  ON categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own categories
CREATE POLICY "Users can update their own categories" 
  ON categories FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own categories
CREATE POLICY "Users can delete their own categories" 
  ON categories FOR DELETE 
  USING (auth.uid() = user_id);

-- Add column to tasks table for custom category ID
ALTER TABLE tasks ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update the updated_at column
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a function to maintain only one default category per user
CREATE OR REPLACE FUNCTION maintain_single_default_category()
RETURNS TRIGGER AS $$
BEGIN
    -- If this category is being set as default
    IF NEW.is_default = TRUE THEN
        -- Unset any other defaults for this user
        UPDATE categories
        SET is_default = FALSE
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce single default category
CREATE TRIGGER enforce_single_default_category
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
WHEN (NEW.is_default = TRUE)
EXECUTE FUNCTION maintain_single_default_category();

-- Create seed data for existing users with their default categories
INSERT INTO categories (name, user_id, subcategories, is_default)
SELECT 
  'Work', 
  id, 
  ARRAY['Core Execution', 'Planning & Strategy', 'Communication & Meetings', 'Learning & Research', 'Maintenance/Admin', 'Projects & Deliverables'],
  TRUE
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM categories);

INSERT INTO categories (name, user_id, subcategories)
SELECT 
  'Personal', 
  id, 
  ARRAY['Health & Wellness', 'Relationships & Social', 'Home & Chores', 'Finance & Admin', 'Growth & Learning', 'Fun & Recreation']
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM categories WHERE name = 'Personal');

INSERT INTO categories (name, user_id, subcategories)
SELECT 
  'Childcare', 
  id, 
  ARRAY['Core Care', 'Play & Engagement', 'Learning & Schoolwork', 'Routines', 'Outings & Activities', 'Admin']
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM categories WHERE name = 'Childcare');

INSERT INTO categories (name, user_id, subcategories)
SELECT 
  'Other', 
  id, 
  ARRAY['Core', 'Unexpected/Interruptions', 'Unsorted', 'Overflow', 'External Requests', 'Reflections & Journaling']
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM categories WHERE name = 'Other');

-- Create a view to help with task category migration
CREATE OR REPLACE VIEW category_migration_helper AS
SELECT 
  t.id as task_id,
  t.user_id,
  t.category_name,
  c.id as category_id,
  c.name as category_name
FROM 
  tasks t
LEFT JOIN 
  categories c ON LOWER(t.category_name) = LOWER(c.name) AND t.user_id = c.user_id
WHERE 
  t.category_id IS NULL AND t.category_name IS NOT NULL;

-- Create a function to help migrate tasks to use the new category_id
CREATE OR REPLACE FUNCTION migrate_task_categories()
RETURNS void AS $$
BEGIN
  -- Update tasks to use the new category_id based on the category_name match
  UPDATE tasks t
  SET category_id = c.category_id
  FROM category_migration_helper c
  WHERE t.id = c.task_id AND t.category_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_task_categories();
