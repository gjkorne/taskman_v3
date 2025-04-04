-- Add is_deleted column to time_sessions table
ALTER TABLE public.time_sessions ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Add index for faster filtering on is_deleted
CREATE INDEX IF NOT EXISTS idx_time_sessions_is_deleted ON public.time_sessions(is_deleted);

-- Update policy to exclude deleted sessions unless explicitly queried
ALTER POLICY "Allow users to view their own time sessions" ON public.time_sessions 
  USING (auth.uid() = user_id);

-- Create a policy for deleting time sessions
CREATE POLICY "Allow users to delete their own time sessions" ON public.time_sessions
  FOR DELETE USING (auth.uid() = user_id);
