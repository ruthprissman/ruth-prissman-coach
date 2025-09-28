-- Allow anonymous users to insert into speaker_leads table
DROP POLICY IF EXISTS "Admins manage speaker leads" ON public.speaker_leads;

-- Create new policy to allow anonymous users to insert
CREATE POLICY "Allow anonymous insert to speaker_leads" 
ON public.speaker_leads 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Create policy for authenticated admin access
CREATE POLICY "Admin full access to speaker_leads" 
ON public.speaker_leads 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = (auth.jwt() ->> 'email') 
    AND email = 'ruthprissman@gmail.com'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = (auth.jwt() ->> 'email') 
    AND email = 'ruthprissman@gmail.com'
  )
);