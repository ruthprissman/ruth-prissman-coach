-- Security hardening: lock down "full open access" RLS policies.
--
-- Background: several public tables carried a PERMISSIVE policy `FOR ALL ... USING (true)`
-- granting the anon role read AND write AND delete. Because RLS policies are OR-combined,
-- those single policies overrode the restrictive service_role/admin policies that sat beside them.
-- This exposed content tables to anonymous tampering/deletion and exposed admin/finance
-- config tables (payment_methods, finance_categories, etc.) to anonymous reads.
--
-- Fix model (verified against frontend usage):
--   * Public-content tables  -> anon may SELECT only; writes restricted to admin/service_role.
--   * Admin/internal tables  -> no anon access at all; admin/service_role only.
--
-- Idempotent: drops every existing policy on the target tables, then recreates a clean set.

DO $$
DECLARE
  t text;
  pol record;
  public_read text[] := ARRAY[
    'professional_content','faq_questions','stories','categories','static_links','testimonials'
  ];
  admin_only text[] := ARRAY[
    'exercises','calendar_slots','payment_methods','finance_categories',
    'email_campaigns','article_publications','content_publish_options','marketing_email_drafts'
  ];
  all_t text[];
BEGIN
  all_t := public_read || admin_only;

  -- Remove ALL existing policies on the target tables (clears the "full open access" landmines)
  FOREACH t IN ARRAY all_t LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;

  -- Public-content tables: anyone may READ; only admin/service_role may write.
  FOREACH t IN ARRAY public_read LOOP
    EXECUTE format('CREATE POLICY "Public read access" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Admin full access" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;

  -- Admin/internal tables: no anonymous access at all.
  FOREACH t IN ARRAY admin_only LOOP
    EXECUTE format('CREATE POLICY "Admin full access" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
