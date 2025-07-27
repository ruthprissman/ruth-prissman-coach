-- Update the check constraint to allow 'success' status in addition to 'sent' and 'failed'
ALTER TABLE public.email_logs DROP CONSTRAINT email_logs_status_check;

-- Create new check constraint that allows 'sent', 'failed', and 'success'
ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_status_check 
CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'success'::text]));