// Forwards new subscribers to the external ClearlySend webhook.
// Public endpoint (verify_jwt = false) because it's invoked from public subscription forms.
// Never fail the user's subscription flow if this webhook errors — always return 200.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOKS = {
  content: 'https://www.clearlysend.ruthprissman.co.il/api/subscribe/24053d86b443835826a8f82e0f82d8a3',
  stories: 'https://www.clearlysend.ruthprissman.co.il/api/subscribe/f595a6a73acb733eff6ba27447d1c935',
} as const;

interface Payload {
  list: 'content' | 'stories';
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  source?: string;
  consent_form_url?: string;
  tag?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    const url = WEBHOOKS[body.list];
    if (!url || !body.email) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const name =
      body.name?.trim() ||
      [body.first_name, body.last_name].filter(Boolean).join(' ').trim() ||
      body.email;

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      undefined;

    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      email: body.email,
      name,
      marketing_consent: true,
      privacy_consent: true,
      consent_form_url: body.consent_form_url || 'https://coach.ruthprissman.co.il',
      consent_timestamp: now,
      subscribed_at: now,
      source: body.source || 'ruthprissman.co.il',
    };
    if (body.first_name) payload.first_name = body.first_name;
    if (body.last_name) payload.last_name = body.last_name;
    if (body.phone) payload.phone = body.phone;
    if (body.tag) payload.tag = body.tag;
    if (ip) payload.ip_address = ip;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    console.log('ClearlySend forward:', body.list, resp.status, text.slice(0, 300));

    return new Response(
      JSON.stringify({ ok: resp.ok, status: resp.status }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (e: any) {
    console.error('forward-subscription error:', e?.message ?? e);
    return new Response(JSON.stringify({ ok: false, error: 'internal' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
