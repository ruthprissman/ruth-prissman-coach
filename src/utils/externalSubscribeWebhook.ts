// Fire-and-forget forwarder to the external ClearlySend webhook.
// Never throws — subscription flows must not fail if the webhook is down.
import { supabase } from '@/integrations/supabase/client';

export interface ForwardSubscriptionInput {
  list: 'content' | 'stories';
  email: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  source?: string | null;
  tag?: string | null;
}

export async function forwardSubscriptionToClearlySend(
  input: ForwardSubscriptionInput,
): Promise<void> {
  try {
    const consent_form_url =
      typeof window !== 'undefined' ? window.location.href : undefined;
    await supabase.functions.invoke('forward-subscription', {
      body: { ...input, consent_form_url },
    });
  } catch (err) {
    console.error('forwardSubscriptionToClearlySend failed:', err);
  }
}
