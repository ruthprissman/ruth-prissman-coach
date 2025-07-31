-- Create table for scheduled emails
CREATE TABLE public.scheduled_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipients text[] NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  article_id integer REFERENCES public.professional_content(id),
  scheduled_datetime timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  error_message text
);

-- Enable RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Full access to scheduled emails" 
ON public.scheduled_emails 
FOR ALL 
USING (true);

-- Create index for efficient cron job queries
CREATE INDEX idx_scheduled_emails_datetime_status 
ON public.scheduled_emails (scheduled_datetime, status) 
WHERE status = 'pending';