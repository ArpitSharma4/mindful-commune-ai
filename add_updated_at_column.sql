-- Migration to add updated_at column to journal_entries table
-- Run this script to update your existing database

-- Add the updated_at column to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Update existing records to have updated_at = created_at
UPDATE journal_entries 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add comment for the new column
COMMENT ON COLUMN journal_entries.updated_at IS 'The date and time the entry was last updated.';
