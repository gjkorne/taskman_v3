-- Create task_sessions table for tracking time spent on tasks
CREATE TABLE IF NOT EXISTS task_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTERVAL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups by task
CREATE INDEX IF NOT EXISTS idx_task_sessions_task_id ON task_sessions(task_id);

-- Create RLS policies for task_sessions
ALTER TABLE task_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own task sessions
CREATE POLICY task_sessions_select_policy
  ON task_sessions FOR SELECT
  USING (created_by = auth.uid());

-- Policy: Users can only insert their own task sessions
CREATE POLICY task_sessions_insert_policy
  ON task_sessions FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Policy: Users can only update their own task sessions
CREATE POLICY task_sessions_update_policy
  ON task_sessions FOR UPDATE
  USING (created_by = auth.uid());

-- Policy: Users can only delete their own task sessions
CREATE POLICY task_sessions_delete_policy
  ON task_sessions FOR DELETE
  USING (created_by = auth.uid());
