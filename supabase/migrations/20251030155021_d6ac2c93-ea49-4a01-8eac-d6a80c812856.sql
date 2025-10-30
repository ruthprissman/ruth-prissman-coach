-- Add source and consent columns to content_subscribers table
ALTER TABLE content_subscribers 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

ALTER TABLE content_subscribers 
ADD COLUMN IF NOT EXISTS consent BOOLEAN DEFAULT true;

-- Create index for better performance on source queries
CREATE INDEX IF NOT EXISTS idx_content_subscribers_source 
ON content_subscribers(source);