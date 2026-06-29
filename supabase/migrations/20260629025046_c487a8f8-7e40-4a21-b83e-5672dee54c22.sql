
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE email = (auth.jwt() ->> 'email') AND email = 'ruthprissman@gmail.com');
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.content_subscriber_email_exists(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.content_subscribers WHERE lower(email) = lower(_email));
$$;
REVOKE EXECUTE ON FUNCTION public.content_subscriber_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.content_subscriber_email_exists(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.story_subscriber_email_exists(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.story_subscribers WHERE lower(email) = lower(_email));
$$;
REVOKE EXECUTE ON FUNCTION public.story_subscriber_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.story_subscriber_email_exists(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.admins;
DROP POLICY IF EXISTS "Service role full access to admins" ON public.admins;
DROP POLICY IF EXISTS "Admin can read admins" ON public.admins;
CREATE POLICY "Service role full access to admins" ON public.admins FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admin can read admins" ON public.admins FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Allow anonymous select for duplicate check" ON public.content_subscribers;
DROP POLICY IF EXISTS "Allow anonymous subscription changes for content_subscribers" ON public.content_subscribers;
DROP POLICY IF EXISTS "Anon can unsubscribe from content_subscribers" ON public.content_subscribers;
CREATE POLICY "Anon can unsubscribe from content_subscribers" ON public.content_subscribers FOR UPDATE TO anon USING (true) WITH CHECK (is_subscribed = false);

DROP POLICY IF EXISTS "anon full access on story_subscribers" ON public.story_subscribers;
DROP POLICY IF EXISTS "anon users can SELECT from story_subscribers" ON public.story_subscribers;
DROP POLICY IF EXISTS "full open access on story_subscribers" ON public.story_subscribers;
DROP POLICY IF EXISTS "Allow anonymous subscription changes for story_subscribers" ON public.story_subscribers;
DROP POLICY IF EXISTS "Anon can insert story_subscribers" ON public.story_subscribers;
DROP POLICY IF EXISTS "Anon can unsubscribe from story_subscribers" ON public.story_subscribers;
DROP POLICY IF EXISTS "Admin can read story_subscribers" ON public.story_subscribers;
CREATE POLICY "Anon can insert story_subscribers" ON public.story_subscribers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can unsubscribe from story_subscribers" ON public.story_subscribers FOR UPDATE TO anon USING (true) WITH CHECK (is_subscribed = false);
CREATE POLICY "Admin can read story_subscribers" ON public.story_subscribers FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "anon full access on future_sessions" ON public.future_sessions;
DROP POLICY IF EXISTS "anon users can SELECT from future_sessions" ON public.future_sessions;
DROP POLICY IF EXISTS "full open access on future_sessions" ON public.future_sessions;
DROP POLICY IF EXISTS "Admin can manage future_sessions" ON public.future_sessions;
CREATE POLICY "Admin can manage future_sessions" ON public.future_sessions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "full open access on email_delivery_attempts" ON public.email_delivery_attempts;
DROP POLICY IF EXISTS "Service role full access to email_delivery_attempts" ON public.email_delivery_attempts;
DROP POLICY IF EXISTS "Admin can read email_delivery_attempts" ON public.email_delivery_attempts;
CREATE POLICY "Service role full access to email_delivery_attempts" ON public.email_delivery_attempts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admin can read email_delivery_attempts" ON public.email_delivery_attempts FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Full access to scheduled emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Service role full access to scheduled_emails" ON public.scheduled_emails;
DROP POLICY IF EXISTS "Admin can manage scheduled_emails" ON public.scheduled_emails;
CREATE POLICY "Service role full access to scheduled_emails" ON public.scheduled_emails FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admin can manage scheduled_emails" ON public.scheduled_emails FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role full access to transactions" ON public.transactions;
CREATE POLICY "Service role full access to transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admin can manage transactions" ON public.transactions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view session attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload session attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update session attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete session attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage session attachments" ON storage.objects;
CREATE POLICY "Admin can manage session attachments" ON storage.objects FOR ALL USING (bucket_id = 'session-attachments' AND public.is_admin()) WITH CHECK (bucket_id = 'session-attachments' AND public.is_admin());

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.set_future_session_end_time() SET search_path = public;
ALTER FUNCTION public.clean_expired_publication_locks() SET search_path = public;
ALTER FUNCTION public.normalize_registration_email() SET search_path = public;
ALTER FUNCTION public.mark_overdue_sessions() SET search_path = public;
ALTER FUNCTION public.update_future_sessions_timestamp() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
