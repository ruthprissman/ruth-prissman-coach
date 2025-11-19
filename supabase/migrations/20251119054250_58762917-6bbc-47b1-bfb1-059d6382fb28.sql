-- Drop the status check constraint completely to allow any status value
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;