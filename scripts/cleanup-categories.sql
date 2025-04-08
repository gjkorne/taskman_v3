-- SQL Script to clean up category conflicts in Supabase
-- Run this in the Supabase SQL Editor

-- 1. First, identify any remaining z_ prefixed categories
SELECT id, name, user_id, created_at, updated_at
FROM categories
WHERE name LIKE 'z\_%' ESCAPE '\';

-- 2. Identify any duplicate category names (case insensitive)
WITH category_names AS (
  SELECT id, LOWER(name) as lower_name, name, user_id
  FROM categories
)
SELECT 
  c1.id as id1, 
  c1.name as name1, 
  c2.id as id2, 
  c2.name as name2, 
  c1.user_id
FROM category_names c1
JOIN category_names c2 ON 
  c1.lower_name = c2.lower_name AND 
  c1.user_id = c2.user_id AND 
  c1.id < c2.id;

-- 3. Update tasks from z_ categories to use their non-z_ counterparts
-- Replace 'z_category_id' and 'regular_category_id' with actual IDs from step 1
-- UPDATE tasks
-- SET category_id = 'regular_category_id'
-- WHERE category_id = 'z_category_id';

-- 4. Delete z_ prefixed categories
-- Replace 'YOUR_USER_ID' with your actual user ID
-- DELETE FROM categories
-- WHERE name LIKE 'z\_%' ESCAPE '\' AND user_id = 'YOUR_USER_ID';

-- 5. Check for categories without names
SELECT id, user_id, created_at, updated_at
FROM categories
WHERE name IS NULL OR name = '';

-- 6. Fix categories without names (if any)
-- UPDATE categories
-- SET name = 'Unnamed Category ' || id
-- WHERE name IS NULL OR name = '';

-- 7. Check for orphaned tasks (tasks with category_id that doesn't exist)
SELECT t.id, t.title, t.category_id
FROM tasks t
LEFT JOIN categories c ON t.category_id = c.id
WHERE c.id IS NULL;

-- 8. Fix orphaned tasks by assigning them to a default category
-- Replace 'DEFAULT_CATEGORY_ID' with your default category ID
-- UPDATE tasks
-- SET category_id = 'DEFAULT_CATEGORY_ID'
-- WHERE category_id IN (
--   SELECT t.category_id
--   FROM tasks t
--   LEFT JOIN categories c ON t.category_id = c.id
--   WHERE c.id IS NULL
-- );

-- 9. Check for any remaining category conflicts
WITH category_names AS (
  SELECT id, LOWER(name) as lower_name, name, user_id
  FROM categories
)
SELECT 
  c1.id as id1, 
  c1.name as name1, 
  c2.id as id2, 
  c2.name as name2, 
  c1.user_id
FROM category_names c1
JOIN category_names c2 ON 
  c1.lower_name = c2.lower_name AND 
  c1.user_id = c2.user_id AND 
  c1.id < c2.id;
