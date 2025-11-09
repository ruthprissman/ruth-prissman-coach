-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  css TEXT NOT NULL,
  placeholders JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (admins) can manage templates
CREATE POLICY "Authenticated users can view templates"
ON public.email_templates
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert templates"
ON public.email_templates
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update templates"
ON public.email_templates
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete templates"
ON public.email_templates
FOR DELETE
USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();