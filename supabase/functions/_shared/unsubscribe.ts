// Shared helpers for the secure unsubscribe flow.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export const SITE_URL = 'https://coach.ruthprissman.co.il';

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Look up a subscriber's unsubscribe token by exact stored email.
 * Bulk senders pass the email straight from the subscriber list, so an exact match is correct.
 */
export async function getUnsubscribeToken(db: SupabaseClient, email: string): Promise<string | null> {
  try {
    const { data: c } = await db
      .from('content_subscribers').select('unsubscribe_token').eq('email', email).maybeSingle();
    if (c?.unsubscribe_token) return c.unsubscribe_token as string;
    const { data: s } = await db
      .from('story_subscribers').select('unsubscribe_token').eq('email', email).maybeSingle();
    return (s?.unsubscribe_token as string) ?? null;
  } catch (_e) {
    return null;
  }
}

/** Replace plain /unsubscribe links in an email body with a tokenized one-click link. */
export function injectUnsubscribeToken(html: string, token: string): string {
  const url = `${SITE_URL}/unsubscribe?token=${token}`;
  return html
    .replace(/https?:\/\/[^"'\s)<]*\/unsubscribe(\?[^"'\s)<]*)?(?=["'\s)<]|$)/g, url)
    .replace(/(["'(])\/unsubscribe(\?[^"'\s)<]*)?(?=["'\s)<])/g, `$1${url}`);
}

/** Per-recipient personalization; returns the html unchanged if the recipient has no token. */
export async function personalizeUnsubscribe(db: SupabaseClient, html: string, email: string): Promise<string> {
  if (!html || !email) return html;
  const token = await getUnsubscribeToken(db, email);
  return token ? injectUnsubscribeToken(html, token) : html;
}
