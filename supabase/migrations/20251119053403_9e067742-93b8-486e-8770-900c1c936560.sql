-- Allow anonymous users to insert leads from landing pages
CREATE POLICY "Allow anonymous insert for landing page leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  source IN ('pre-pray-landing', 'lp-prayer-guide', 'workshop-landing', 'website')
);