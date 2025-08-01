-- Add project-specific fields to the ideas table
-- This migration adds proper columns for repository URL, demo URL, and project attachments
-- instead of storing them as JSON in the attachments array

-- Add repository URL field
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS repository_url TEXT;

-- Add demo URL field  
ALTER TABLE ideas
ADD COLUMN IF NOT EXISTS demo_url TEXT;

-- Add project attachments field (JSON string)
ALTER TABLE ideas
ADD COLUMN IF NOT EXISTS project_attachments TEXT;

-- Add comments for clarity
COMMENT ON COLUMN ideas.repository_url IS 'URL to the project repository (e.g., GitHub, GitLab)';
COMMENT ON COLUMN ideas.demo_url IS 'URL to the live demo or deployed project';
COMMENT ON COLUMN ideas.project_attachments IS 'JSON string containing array of ProjectAttachment objects';

-- Create an index on repository_url for faster searches
CREATE INDEX IF NOT EXISTS idx_ideas_repository_url ON ideas(repository_url);

-- Create an index on demo_url for faster searches  
CREATE INDEX IF NOT EXISTS idx_ideas_demo_url ON ideas(demo_url);
