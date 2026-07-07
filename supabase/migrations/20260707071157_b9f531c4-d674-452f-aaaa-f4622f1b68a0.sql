
-- =========================================================================
-- email_items & email_templates: admin only
-- =========================================================================
DROP POLICY IF EXISTS "Authenticated users can view email items" ON public.email_items;
DROP POLICY IF EXISTS "Authenticated users can insert email items" ON public.email_items;
DROP POLICY IF EXISTS "Authenticated users can update email items" ON public.email_items;
DROP POLICY IF EXISTS "Authenticated users can delete email items" ON public.email_items;

CREATE POLICY "Admin manages email items"
  ON public.email_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can insert email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can update email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can delete email templates" ON public.email_templates;

CREATE POLICY "Admin manages email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================================================================
-- Anon insert policies: replace WITH CHECK (true) with meaningful checks
-- =========================================================================
DROP POLICY IF EXISTS "Anyone can register for workshops" ON public.registrations;
CREATE POLICY "Anon can register for workshops"
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND length(email) BETWEEN 3 AND 320
    AND full_name IS NOT NULL AND length(full_name) BETWEEN 1 AND 200
  );

DROP POLICY IF EXISTS "Allow anonymous insert to speaker_leads" ON public.speaker_leads;
CREATE POLICY "Anon can submit speaker leads"
  ON public.speaker_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND length(email) BETWEEN 3 AND 320
  );

DROP POLICY IF EXISTS "Anon can insert story_subscribers" ON public.story_subscribers;
CREATE POLICY "Anon can subscribe to stories"
  ON public.story_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND length(email) BETWEEN 3 AND 320
    AND COALESCE(is_subscribed, true) = true
  );

-- =========================================================================
-- Storage policies
-- =========================================================================

-- Remove the blanket "any authenticated user can upload to any bucket" rule.
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;

-- Remove the anonymous public DELETE on the Stories bucket.
DROP POLICY IF EXISTS "Allow all to select pdf 1veczeb_1" ON storage.objects;

-- Restrict receipts to the admin only (currently open to all authenticated users).
DROP POLICY IF EXISTS "Authenticated can read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete receipts" ON storage.objects;

CREATE POLICY "Admin reads receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin());
CREATE POLICY "Admin uploads receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND public.is_admin());
CREATE POLICY "Admin updates receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin())
  WITH CHECK (bucket_id = 'receipts' AND public.is_admin());
CREATE POLICY "Admin deletes receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin());

-- pre-pray-samples: only admin may upload; drop broad list-all SELECT policy
-- (public files remain accessible via their direct public URLs since the bucket is public).
DROP POLICY IF EXISTS "Admin can upload to pre-pray-samples" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Admin uploads pre-pray samples"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pre-pray-samples' AND public.is_admin());
CREATE POLICY "Admin updates pre-pray samples"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pre-pray-samples' AND public.is_admin())
  WITH CHECK (bucket_id = 'pre-pray-samples' AND public.is_admin());
CREATE POLICY "Admin deletes pre-pray samples"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pre-pray-samples' AND public.is_admin());

-- Session attachments: admin-only read policy (bucket will be flipped to private separately).
CREATE POLICY "Admin reads session attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'session-attachments' AND public.is_admin());

-- =========================================================================
-- Revoke EXECUTE on SECURITY DEFINER helper functions from anon/authenticated.
-- is_admin() is still callable inside RLS policies (definer context).
-- =========================================================================
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.content_subscriber_email_exists(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.story_subscriber_email_exists(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.clean_expired_publication_locks() FROM anon, authenticated, PUBLIC;
