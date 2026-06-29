-- M3: secure unsubscribe.
-- Adds a per-subscriber unsubscribe token (for one-click links in emails), an audit log,
-- and removes the anonymous direct-UPDATE policies so ALL unsubscribes go through the
-- `unsubscribe` Edge Function (token one-click, or rate-limited + logged manual form).

-- 1) Per-subscriber tokens (existing rows get a unique token via the volatile default).
ALTER TABLE public.content_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.story_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS idx_content_subscribers_unsub_token
  ON public.content_subscribers (unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_story_subscribers_unsub_token
  ON public.story_subscribers (unsubscribe_token);

-- 2) Audit log for unsubscribe / resubscribe actions (so the admin can review and reverse abuse).
CREATE TABLE IF NOT EXISTS public.unsubscribe_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       text,
  list_type   text,
  action      text NOT NULL DEFAULT 'unsubscribe',
  method      text NOT NULL,            -- 'token' | 'manual'
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.unsubscribe_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages unsubscribe_log" ON public.unsubscribe_log;
CREATE POLICY "Service role manages unsubscribe_log"
  ON public.unsubscribe_log FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin can read unsubscribe_log" ON public.unsubscribe_log;
CREATE POLICY "Admin can read unsubscribe_log"
  ON public.unsubscribe_log FOR SELECT TO authenticated USING (public.is_admin());

-- 3) Remove anonymous direct-write policies. Unsubscribes now go through the Edge Function
--    (service_role). Anonymous SUBSCRIBE (INSERT) policies are intentionally left in place.
DROP POLICY IF EXISTS "Anon can unsubscribe from content_subscribers" ON public.content_subscribers;
DROP POLICY IF EXISTS "Anon can unsubscribe from story_subscribers" ON public.story_subscribers;
