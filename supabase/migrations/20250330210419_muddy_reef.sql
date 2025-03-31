/*
  # Core Tables Setup

  1. New Tables
    - tasks
      - Primary task management table
      - Stores task details, status, and metadata
    - time_logs
      - Records time spent on tasks
      - Links to tasks and users
    - daily_summary
      - Daily productivity metrics and summaries
      - Aggregates task and time data per day
    - task_assignments
      - Manages task assignments to users
      - Many-to-many relationship between tasks and users
    - task_links
      - Tracks relationships between tasks
      - Supports parent-child and dependency relationships
    - event_logs
      - Audit trail for all significant system events
      - Tracks changes and actions
    - interruptions
      - Records work interruptions
      - Links to affected tasks

  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users to:
      - Read their own data
      - Create new records
      - Update their own records
      - Delete their own records
*/

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  project_id uuid REFERENCES projects(id),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  activity_state text NOT NULL DEFAULT 'idle',
  category int,
  subcategory int,
  priority int,
  estimated_time_minutes int,
  recurring_type int,
  is_exclusive boolean DEFAULT false,
  is_evergreen boolean DEFAULT false,
  is_blocked boolean DEFAULT false,
  is_waiting boolean DEFAULT false,
  is_shared boolean DEFAULT false,
  is_milestone boolean DEFAULT false,
  has_deadline boolean DEFAULT false,
  energy_level int,
  location_tag int,
  context_cost int,
  parent_task_id uuid REFERENCES tasks(id),
  subtask_level int DEFAULT 0,
  manual_sort_order int,
  template_task_id uuid REFERENCES tasks(id),
  cloned_from_task_id uuid REFERENCES tasks(id),
  visibility text DEFAULT 'private',
  due_date date,
  remind_at timestamptz,
  custom_tags text[],
  notes text,
  attachment_urls text[],
  features_json jsonb,
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now(),
  version int DEFAULT 1,
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'archived')),
  CONSTRAINT valid_activity_state CHECK (activity_state IN ('idle', 'in_progress', 'paused')),
  CONSTRAINT valid_visibility CHECK (visibility IN ('private', 'shared', 'public')),
  CONSTRAINT valid_subtask_level CHECK (subtask_level <= 1)
);

-- Time logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration int, -- duration in seconds rather than interval
  notes text,
  exclusive boolean DEFAULT false,
  is_manual boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now(),
  original_duration int, -- for audit of edited logs
  device_id text -- for sync conflict resolution
);

-- Daily summary table
CREATE TABLE IF NOT EXISTS daily_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  date date NOT NULL,
  total_time_logged interval,
  tasks_completed int DEFAULT 0,
  tasks_created int DEFAULT 0,
  productivity_score decimal,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Task assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'assignee',
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT unique_task_user UNIQUE (task_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('assignee', 'reviewer', 'observer'))
);

-- Task links table
CREATE TABLE IF NOT EXISTS task_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  target_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  link_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT valid_link_type CHECK (link_type IN ('blocks', 'blocked_by', 'relates_to', 'duplicates', 'parent_of', 'child_of')),
  CONSTRAINT no_self_links CHECK (source_task_id != target_task_id)
);

-- Event logs table
CREATE TABLE IF NOT EXISTS event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  changes jsonb,
  occurred_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN ('created', 'updated', 'deleted', 'status_changed', 'assigned', 'unassigned'))
);

-- Interruptions table
CREATE TABLE IF NOT EXISTS interruptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration interval,
  interruption_type text NOT NULL,
  description text,
  impact_level text NOT NULL DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_impact_level CHECK (impact_level IN ('low', 'medium', 'high', 'critical'))
);

-- Projects table (missing from migration)
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  due_date date,
  archived boolean DEFAULT false
);

-- User settings table (missing but needed)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  timezone text DEFAULT 'UTC',
  archived_after_days int DEFAULT 30,
  max_next_up_tasks int DEFAULT 3,
  onboarding_complete boolean DEFAULT false,
  default_view text DEFAULT 'active',
  notification_preferences jsonb,
  feature_flags jsonb
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interruptions ENABLE ROW LEVEL SECURITY;

-- Tasks Policies
CREATE POLICY "Users can view tasks they created or are assigned to"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM task_assignments
      WHERE task_assignments.task_id = tasks.id
      AND task_assignments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Time Logs Policies
CREATE POLICY "Users can view their own time logs"
  ON time_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own time logs"
  ON time_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own time logs"
  ON time_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Daily Summary Policies
CREATE POLICY "Users can view their own daily summaries"
  ON daily_summary
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own daily summaries"
  ON daily_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own daily summaries"
  ON daily_summary
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Task Assignments Policies
CREATE POLICY "Users can view assignments for their tasks"
  ON task_assignments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignments.task_id
      AND tasks.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create assignments for their tasks"
  ON task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignments.task_id
      AND tasks.created_by = auth.uid()
    )
  );

-- Task Links Policies
CREATE POLICY "Users can view task links"
  ON task_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE (tasks.id = task_links.source_task_id OR tasks.id = task_links.target_task_id)
      AND (tasks.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM task_assignments
          WHERE task_assignments.task_id = tasks.id
          AND task_assignments.user_id = auth.uid()
        )
      )
    )
  );

-- Event Logs Policies
CREATE POLICY "Users can view event logs for their tasks"
  ON event_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = event_logs.entity_id
      AND tasks.created_by = auth.uid()
    )
  );

-- Interruptions Policies
CREATE POLICY "Users can view their own interruptions"
  ON interruptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own interruptions"
  ON interruptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interruptions"
  ON interruptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Task visibility policy
CREATE POLICY "Visibility based access to tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    (visibility = 'private' AND user_id = auth.uid()) OR
    (visibility = 'shared' AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM task_assignments
        WHERE task_assignments.task_id = tasks.id
        AND task_assignments.user_id = auth.uid()
      )
    )) OR
    (visibility = 'public')
  );

-- Delete policies where missing
CREATE POLICY "Users can delete their own time logs"
  ON time_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = time_logs.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_priority 
  ON tasks(user_id, status, priority);
  
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id 
  ON time_logs(task_id);
  
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time 
  ON time_logs(start_time);

CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id 
  ON tasks(parent_task_id);