/*
  # Create Documents Table and Admin User

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `name` (text) - Document name
      - `description` (text) - Document description
      - `filename` (text) - Original filename
      - `size` (bigint) - File size in bytes
      - `type` (text) - Document type (TDS, ESR, MSDS, etc.)
      - `product_type` (text) - Product category (structural-floor or underlayment)
      - `file_data` (bytea) - PDF file content stored as binary
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - NO RLS enabled as requested
    - Admin-only access through authentication

  3. Admin User
    - Email: admin@gmail.com
    - Password: kdfhu@#@#2323
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  filename text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  type text NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('structural-floor', 'underlayment')),
  file_data bytea NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_product_type ON documents(product_type);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();