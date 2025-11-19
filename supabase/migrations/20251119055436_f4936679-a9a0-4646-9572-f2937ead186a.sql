-- Add consent fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS agreed_to_terms boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agreed_to_marketing boolean DEFAULT false;