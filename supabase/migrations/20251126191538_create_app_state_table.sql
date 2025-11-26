/*
  # Create app_state table

  1. New Tables
    - `app_state`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `current_step` (integer, 1-4)
      - `form_data` (jsonb, project form data)
      - `selected_documents` (jsonb, array of selected documents)
      - `dark_mode` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_state` table
    - Add policy for users to read/write only their own state
*/

CREATE TABLE IF NOT EXISTS app_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  current_step integer DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 4),
  form_data jsonb DEFAULT '{}'::jsonb,
  selected_documents jsonb DEFAULT '[]'::jsonb,
  dark_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own app state"
  ON app_state
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own app state"
  ON app_state
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own app state"
  ON app_state
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own app state"
  ON app_state
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_app_state_user_id ON app_state(user_id);
