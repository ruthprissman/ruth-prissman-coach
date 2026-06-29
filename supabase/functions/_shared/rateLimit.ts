// Lightweight rate limiting for public Edge Functions, backed by the public.rate_limits table.
//
// Design notes:
// - Uses the service-role key (functions only) to read/write the ledger.
// - FAIL-OPEN: if the limiter itself errors or is misconfigured, the request is allowed.
//   For transactional emails (confirmations, guides) it is better to occasionally let one
//   through than to block a legitimate user because of an infra hiccup.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

/**
 * Returns true when the action is allowed (under the limit) and records it.
 * Returns false when the (bucket, identifier) pair already hit `limit` within the window.
 */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey || !identifier) return true; // fail-open

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { count, error } = await admin
      .from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', bucket)
      .eq('identifier', identifier)
      .gte('created_at', since);

    if (error) return true; // fail-open on read error
    if ((count ?? 0) >= limit) return false;

    await admin.from('rate_limits').insert({ bucket, identifier });
    return true;
  } catch (_e) {
    return true; // fail-open
  }
}

/** Best-effort client IP from the proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? '';
  return (xff.split(',')[0] || '').trim() || 'unknown';
}

/** Standard 429 response. */
export function tooManyRequests(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
  );
}
