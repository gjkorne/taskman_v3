/*
  # Task List Structure

  1. New Tables
    - `task_lists`
      - For organizing tasks into lists/projects
      - Supports hierarchical organization
      - Tracks progress and status
    - `task_list_members`
      - Manages access and permissions
      - Supports team collaboration

  2. Security
    - Enable RLS on all tables
    - Policies for list creation and management
    - Team-based access control
*/

-- Create task lists table
CREATE TABLE IF NOT EXISTS task_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  parent_list_id uuid REFERENCES task_lists(id),
  status text NOT NULL DEFAULT 'active',
  priority text NOT NULL DEFAULT 'medium',
  due_date timestamptz,
  estimated_hours int,
  progress_percent int DEFAULT 0,
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'archived')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT valid_progress CHECK (progress_percent BETWEEN 0 AND 100)
);

-- Create task list members table
CREATE TABLE IF NOT EXISTS task_list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES task_lists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'viewer',
  joined_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_list_member UNIQUE (list_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'editor', 'viewer'))
);

-- Add task list reference to tasks table
ALTER TABLE tasks ADD COLUMN list_id uuid REFERENCES task_lists(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_list_members ENABLE ROW LEVEL SECURITY;

-- Policies for task lists
CREATE POLICY "Users can create task lists"
  ON task_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view their task lists"
  ON task_lists
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM task_list_members
      WHERE task_list_members.list_id = task_lists.id
      AND task_list_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their task lists"
  ON task_lists
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their task lists"
  ON task_lists
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Policies for task list members
CREATE POLICY "List owners can manage members"
  ON task_list_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = task_list_members.list_id
      AND task_lists.owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can view their memberships"
  ON task_list_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_task_lists_owner ON task_lists(owner_id);
CREATE INDEX idx_task_lists_parent ON task_lists(parent_list_id);
CREATE INDEX idx_task_list_members_list ON task_list_members(list_id);
CREATE INDEX idx_task_list_members_user ON task_list_members(user_id);
CREATE INDEX idx_tasks_list ON tasks(list_id);

-- Function to calculate list progress
CREATE OR REPLACE FUNCTION update_list_progress()
RETURNS trigger AS $$
BEGIN
  UPDATE task_lists
  SET progress_percent = (
    SELECT COALESCE(
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::float / 
        NULLIF(COUNT(*), 0)::float) * 100
      ),
      0
    )
    FROM tasks
    WHERE list_id = NEW.list_id
  )
  WHERE id = NEW.list_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress when tasks change
CREATE TRIGGER task_status_changed
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_list_progress();