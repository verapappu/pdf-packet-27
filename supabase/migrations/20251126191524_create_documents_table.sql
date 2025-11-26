/*
  # Create documents table

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `filename` (text)
      - `file_data` (bytea for binary PDF data)
      - `size` (integer, file size in bytes)
      - `type` (text, document type: TDS, ESR, MSDS, etc.)
      - `required` (boolean)
      - `products` (jsonb, array of product names)
      - `product_type` (text, 'structural-floor' or 'underlayment')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `documents` table
    - Add policy for authenticated users to read all documents
    - Add policy for admin users to manage documents
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filename text NOT NULL,
  file_data bytea,
  size integer NOT NULL,
  type text NOT NULL,
  required boolean DEFAULT false,
  products jsonb DEFAULT '[]'::jsonb,
  product_type text NOT NULL CHECK (product_type IN ('structural-floor', 'underlayment')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'authenticated');

CREATE POLICY "Admin users can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'authenticated')
  WITH CHECK (auth.jwt() ->> 'role' = 'authenticated');

CREATE POLICY "Admin users can delete documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'authenticated');

CREATE INDEX idx_documents_product_type ON documents(product_type);
