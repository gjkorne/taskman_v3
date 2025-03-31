/*
  # Task NLP Processing Enhancements

  1. New Columns and Types
    - Add NLP-specific fields to tasks table
    - Create task templates table
    - Add task analysis table for ML feedback

  2. Changes
    - Enhance task categorization
    - Add text search capabilities
    - Support task templates and patterns

  3. Security
    - Maintain existing RLS policies
    - Add specific policies for ML-related tables
*/

-- Add NLP-specific columns to tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS nlp_tokens tsvector,
ADD COLUMN IF NOT EXISTS extracted_entities jsonb,
ADD COLUMN IF NOT EXISTS embedding_data jsonb, -- Store embeddings as JSON array instead of vector
ADD COLUMN IF NOT EXISTS confidence_score float CHECK (confidence_score BETWEEN 0 AND 1),
ADD COLUMN IF NOT EXISTS processing_metadata jsonb;

-- Create task templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  pattern_rules jsonb NOT NULL,
  category_mapping jsonb,
  priority_rules jsonb,
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task analysis table
CREATE TABLE IF NOT EXISTS task_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  original_input text NOT NULL,
  processed_result jsonb NOT NULL,
  accuracy_score float,
  user_feedback text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_analysis ENABLE ROW LEVEL SECURITY;

-- Create text search index
CREATE INDEX IF NOT EXISTS tasks_nlp_tokens_idx ON tasks USING gin(nlp_tokens);

-- Create index on embedding data
CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks USING gin(embedding_data jsonb_path_ops);

-- Task templates policies
CREATE POLICY "Users can view public templates"
  ON task_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage their templates"
  ON task_templates
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Task analysis policies
CREATE POLICY "Users can view their task analysis"
  ON task_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_analysis.task_id
      AND tasks.created_by = auth.uid()
    )
  );

-- Function to update task embeddings
CREATE OR REPLACE FUNCTION update_task_embeddings()
RETURNS trigger AS $$
BEGIN
  -- This would be replaced with actual embedding generation logic
  NEW.nlp_tokens := to_tsvector('english', NEW.title || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating embeddings
CREATE TRIGGER update_task_embeddings_trigger
  BEFORE INSERT OR UPDATE OF title, description
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_embeddings();