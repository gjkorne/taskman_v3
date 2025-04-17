-- Add is_starred column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;

-- Update existing tasks to have is_starred set to false
UPDATE tasks 
SET is_starred = FALSE 
WHERE is_starred IS NULL;

-- Add comment to the column
COMMENT ON COLUMN tasks.is_starred IS 'Indicates if a task is starred for "Do Next" priority';
