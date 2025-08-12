-- Add processing locks to article_publications table
ALTER TABLE article_publications 
ADD COLUMN processing_lock_at TIMESTAMP,
ADD COLUMN processing_lock_by TEXT,
ADD COLUMN lock_expires_at TIMESTAMP;

-- Create email delivery tracking table for idempotency
CREATE TABLE IF NOT EXISTS email_delivery_attempts (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL,
  publication_id INTEGER NOT NULL,
  attempt_id TEXT UNIQUE NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sending',
  error_message TEXT,
  recipient_count INTEGER,
  UNIQUE(article_id, publication_id, attempt_id)
);

-- Enable RLS for email_delivery_attempts
ALTER TABLE email_delivery_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for email_delivery_attempts
CREATE POLICY "full open access on email_delivery_attempts" 
ON email_delivery_attempts 
FOR ALL 
USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_email_delivery_attempts_article_publication 
ON email_delivery_attempts(article_id, publication_id);

CREATE INDEX IF NOT EXISTS idx_article_publications_locks 
ON article_publications(processing_lock_at, lock_expires_at);

-- Create function to clean expired locks
CREATE OR REPLACE FUNCTION clean_expired_publication_locks()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE article_publications 
  SET 
    processing_lock_at = NULL,
    processing_lock_by = NULL,
    lock_expires_at = NULL
  WHERE 
    lock_expires_at IS NOT NULL 
    AND lock_expires_at < NOW();
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;