-- Fix security issue: Add search_path to touch_updated_at function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END;
$$;