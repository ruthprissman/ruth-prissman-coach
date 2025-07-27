-- Add story_id column to email_logs table for tracking story emails separately
ALTER TABLE public.email_logs ADD COLUMN story_id integer;

-- Update the existing records to maintain data integrity  
UPDATE public.email_logs SET story_id = article_id WHERE article_id IS NOT NULL;

-- Make article_id nullable since now we can have either article_id or story_id
ALTER TABLE public.email_logs ALTER COLUMN article_id DROP NOT NULL;