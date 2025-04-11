-- Ultra-simple fix for "record new has no field category" error
-- Date: 2025-04-10

-- 1. Drop the constraint that restricts categories to predefined values
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category_name;

-- 2. Add a view to provide backward compatibility
CREATE OR REPLACE VIEW tasks_with_category AS
SELECT 
    t.*,
    t.category_name AS category
FROM 
    tasks t;

-- 3. Recommended: Use the view in your queries
COMMENT ON VIEW tasks_with_category IS 'Use this view for code expecting the category field';
