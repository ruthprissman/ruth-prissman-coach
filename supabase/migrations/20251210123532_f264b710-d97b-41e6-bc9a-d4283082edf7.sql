-- Create table for saving marketing email drafts
CREATE TABLE public.marketing_email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  template_id UUID REFERENCES email_templates(id),
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  background_gradient TEXT DEFAULT 'transparent',
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_email_drafts ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage drafts
CREATE POLICY "Authenticated users can manage email drafts"
ON public.marketing_email_drafts
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_marketing_email_drafts_updated_at
BEFORE UPDATE ON public.marketing_email_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();