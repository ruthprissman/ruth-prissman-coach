-- Rate-limiting support for public Edge Functions + cleanup of a leftover test table.

-- Generic rate-limit ledger. Edge Functions (service_role) record one row per action and
-- count recent rows per (bucket, identifier) to throttle abuse (email bombing / quota drain).
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket      text NOT NULL,
  identifier  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits (bucket, identifier, created_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Only the service role (used by Edge Functions) may touch this table. No anon/authenticated access.
DROP POLICY IF EXISTS "Service role manages rate_limits" ON public.rate_limits;
CREATE POLICY "Service role manages rate_limits"
  ON public.rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Remove the leftover test table (had RLS enabled with zero policies = inaccessible anyway).
DROP TABLE IF EXISTS public."content_subscribers_TEST";
