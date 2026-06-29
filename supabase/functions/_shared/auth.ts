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
    if (!supabaseUrl || !anonKey) return false;

    // The anon key by itself is a valid JWT but not a *user* token — getUser() returns
    // null for it, so anonymous callers are correctly rejected here.
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await client.auth.getUser();
    if (userErr || !userData?.user) return false;

    const { data: isAdmin, error: rpcErr } = await client.rpc('is_admin');
    if (rpcErr) return false;
    return isAdmin === true;
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
