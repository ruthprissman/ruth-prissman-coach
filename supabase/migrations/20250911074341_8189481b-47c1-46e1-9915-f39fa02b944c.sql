-- Fix the RLS policy for leads table to match existing admin pattern
DROP POLICY IF EXISTS "Admins read/write leads" ON public.leads;

CREATE POLICY "Only admin ruthprissman can access leads"
  ON public.leads
  FOR ALL
  USING (EXISTS ( SELECT 1
   FROM admins
  WHERE ((admins.email = (auth.jwt() ->> 'email'::text)) AND (admins.email = 'ruthprissman@gmail.com'::text))))
  WITH CHECK (EXISTS ( SELECT 1
   FROM admins
  WHERE ((admins.email = (auth.jwt() ->> 'email'::text)) AND (admins.email = 'ruthprissman@gmail.com'::text))));