-- Migration: Add role-based access control and RLS policies
-- Date: 2025-04-05

-- Create roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert role types
INSERT INTO public.user_roles (name, description) 
VALUES 
  ('admin', 'Administrator with full access'),
  ('user', 'Regular user with limited access')
ON CONFLICT (name) DO NOTHING;

-- Create user_role_assignments table to link users to roles
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);

-- Set greg@gjkandsons.com as admin
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'greg@gjkandsons.com'
),
admin_role AS (
  SELECT id FROM public.user_roles WHERE name = 'admin'
)
INSERT INTO public.user_role_assignments (user_id, role_id)
SELECT admin_user.id, admin_role.id 
FROM admin_user, admin_role
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own tasks, admins view all" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users update own tasks, admins update all" ON public.tasks;
DROP POLICY IF EXISTS "Users delete own tasks, admins delete all" ON public.tasks;

-- Create policy for users to see only their own tasks or all tasks if admin
CREATE POLICY "Users view own tasks, admins view all" 
ON public.tasks FOR SELECT 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.name = 'admin'
  )
);

-- Policy for inserting tasks (all authenticated users can insert)
CREATE POLICY "Users can insert their own tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Create policy for users to update their own tasks or any task if admin
CREATE POLICY "Users update own tasks, admins update all" 
ON public.tasks FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.name = 'admin'
  )
);

-- Create policy for users to delete their own tasks or any task if admin
CREATE POLICY "Users delete own tasks, admins delete all" 
ON public.tasks FOR DELETE 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.name = 'admin'
  )
);

-- Apply same RLS to time_sessions table
ALTER TABLE public.time_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own time sessions, admins view all" ON public.time_sessions;
DROP POLICY IF EXISTS "Users can insert own time sessions" ON public.time_sessions;
DROP POLICY IF EXISTS "Users update own time sessions, admins update all" ON public.time_sessions;
DROP POLICY IF EXISTS "Users delete own time sessions, admins delete all" ON public.time_sessions;

-- Create policy for users to see only their own time sessions or all if admin
CREATE POLICY "Users view own time sessions, admins view all" 
ON public.time_sessions FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.name = 'admin'
  )
);

-- Policy for inserting time sessions
CREATE POLICY "Users can insert own time sessions" 
ON public.time_sessions FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create policy for users to update their own time sessions or any if admin
CREATE POLICY "Users update own time sessions, admins update all" 
ON public.time_sessions FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.name = 'admin'
  )
);

-- Create policy for users to delete their own time sessions or any if admin
CREATE POLICY "Users delete own time sessions, admins delete all" 
ON public.time_sessions FOR DELETE 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.name = 'admin'
  )
);
