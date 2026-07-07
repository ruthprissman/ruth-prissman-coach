// Shared auth helpers for Edge Functions.
//
// Why: several functions were callable by anyone (verify_jwt=false, no in-code check),
// turning them into an open email relay. The real control is verifying that the caller
// is the authenticated admin. We do that by taking the JWT the client sends in the
// Authorization header and asking the database `is_admin()` (which checks the JWT email
// against the admins table). The public anon key is NOT a user token, so anonymous
// callers resolve to "no user" -> not admin.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

/**
 * Returns true only when the request carries a valid JWT belonging to the admin user.
 * Never throws — any failure resolves to false (deny by default).
 */
export async function isRequestFromAdmin(req: Request): Promise<boolean> {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return false;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) return false;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.email) return false;

    // Use service role to check admin membership so we can revoke EXECUTE
    // on is_admin() from anon/authenticated (Supabase linter finding).
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: row, error: qErr } = await adminClient
      .from('admins')
      .select('id')
      .eq('email', userData.user.email)
      .maybeSingle();
    if (qErr) return false;
    return !!row;
  } catch (_e) {
    return false;
  }
}

/** Standard 403 response for non-admin callers. */
export function forbidden(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Forbidden' }),
    { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
  );
}

/**
 * True when the request authenticates with the project's service-role key.
 * Used for trusted server-to-server calls (e.g. the scheduled-email cron invoking send-email).
 * The service-role key is secret and never exposed to the browser.
 */
export function isServiceRoleRequest(req: Request): boolean {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return serviceKey.length > 0 && token === serviceKey;
}
