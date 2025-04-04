/*
  # User Preferences Table
  
  This migration adds a user_preferences table to store application settings that
  should be consistent across multiple devices.
  
  Features:
  - Stores user preferences as JSON
  - Separate types for app settings vs. UI preferences
  - RLS policies to ensure users can only access their own preferences
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ui_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  theme text NOT NULL DEFAULT 'system',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add comment to the table
COMMENT ON TABLE user_preferences IS 'Stores user preferences for the application';

-- Add comments to the columns
COMMENT ON COLUMN user_preferences.preferences IS 'Application preferences like default sort, behavior settings';
COMMENT ON COLUMN user_preferences.ui_preferences IS 'UI specific preferences like density, view modes';
COMMENT ON COLUMN user_preferences.theme IS 'User theme preference (light, dark, system)';

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create index for faster lookups
CREATE INDEX user_preferences_user_id_index ON user_preferences(user_id);
