-- Allow anonymous users to insert subscribers from landing pages
CREATE POLICY "Allow anonymous insert for landing page subscribers"
ON public.content_subscribers
FOR INSERT
TO anon
WITH CHECK (
  source IN ('lp-prayer-guide', 'website') 
  AND consent = true
);

-- Allow anonymous users to check for duplicate emails
CREATE POLICY "Allow anonymous select for duplicate check"
ON public.content_subscribers
FOR SELECT
TO anon
USING (true);