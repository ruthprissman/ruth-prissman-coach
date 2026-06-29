import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { adminClient } from "../_shared/unsubscribe.ts";
import { checkRateLimit, clientIp, tooManyRequests } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Body {
  token?: string;
  email?: string;
  list?: 'general' | 'stories' | 'all';
  action?: 'unsubscribe' | 'resubscribe';
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeLike = (s: string) => s.replace(/[%_\\]/g, '\\$&');

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const { token, email, list = 'general', action = 'unsubscribe' }: Body = await req.json();
    const db = adminClient();
    const ip = clientIp(req);
    const targetSubscribed = action === 'resubscribe'; // desired is_subscribed value

    const applyTo = (current: boolean) => {
      const patch: Record<string, unknown> = { is_subscribed: targetSubscribed };
      if (!targetSubscribed) patch.unsubscribed_at = new Date().toISOString();
      return patch;
    };

    // -------- Token mode: secure one-click from an email link --------
    if (token) {
      if (!UUID_RE.test(token)) return json(400, { error: 'Invalid token' });

      let found = false;
      let alreadyDone = false;
      let foundEmail: string | null = null;

      for (const table of ['content_subscribers', 'story_subscribers']) {
        const { data } = await db.from(table)
          .select('email, is_subscribed').eq('unsubscribe_token', token).maybeSingle();
        if (data) {
          found = true;
          foundEmail = data.email as string;
          if (data.is_subscribed === targetSubscribed) {
            alreadyDone = true;
          } else {
            await db.from(table).update(applyTo(data.is_subscribed)).eq('unsubscribe_token', token);
          }
        }
      }

      if (found) {
        await db.from('unsubscribe_log').insert({ email: foundEmail, list_type: list, action, method: 'token', ip });
      }
      return json(200, { success: true, found, alreadyDone });
    }

    // -------- Manual mode: typed email, rate-limited + logged --------
    if (email) {
      if (!EMAIL_RE.test(email)) return json(400, { error: 'Invalid email' });

      if (!(await checkRateLimit('unsubscribe-ip', ip, 10, 600)) ||
          !(await checkRateLimit('unsubscribe-email', email.toLowerCase(), 5, 3600))) {
        return tooManyRequests(corsHeaders);
      }

      const tables: string[] = [];
      if (list === 'general' || list === 'all') tables.push('content_subscribers');
      if (list === 'stories' || list === 'all') tables.push('story_subscribers');

      const pattern = escapeLike(email);
      let found = false;
      let alreadyDone = false;

      for (const table of tables) {
        const { data } = await db.from(table)
          .select('email, is_subscribed').ilike('email', pattern).maybeSingle();
        if (data) {
          found = true;
          if (data.is_subscribed === targetSubscribed) {
            alreadyDone = true;
          } else {
            await db.from(table).update(applyTo(data.is_subscribed)).ilike('email', pattern);
          }
        }
      }

      await db.from('unsubscribe_log').insert({ email, list_type: list, action, method: 'manual', ip });
      return json(200, { success: true, found, alreadyDone });
    }

    return json(400, { error: 'token or email is required' });
  } catch (error) {
    console.error('Error in unsubscribe function:', error);
    return json(500, { error: 'Internal server error' });
  }
};

serve(handler);
