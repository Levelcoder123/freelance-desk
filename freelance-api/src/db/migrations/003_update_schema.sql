-- Add project_id to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);

-- Remove pdf_url from invoices table
ALTER TABLE invoices DROP COLUMN IF EXISTS pdf_url;
