import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing scheduled emails...');

    // Get all pending emails that should be sent now
    const now = new Date().toISOString();
    const { data: scheduledEmails, error: fetchError } = await supabaseClient
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_datetime', now);

    if (fetchError) {
      console.error('Error fetching scheduled emails:', fetchError);
      throw new Error('שגיאה בטעינת מיילים מתוזמנים');
    }

    console.log(`Found ${scheduledEmails?.length || 0} emails to process`);

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'אין מיילים לשליחה' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each scheduled email
    for (const scheduledEmail of scheduledEmails) {
      try {
        console.log(`Processing scheduled email ${scheduledEmail.id}`);

        // Mark as processing to avoid duplicate processing
        await supabaseClient
          .from('scheduled_emails')
          .update({ status: 'processing' })
          .eq('id', scheduledEmail.id);

        // Call the existing send-email function
        const sendEmailResponse = await supabaseClient.functions.invoke('send-email', {
          body: {
            recipients: scheduledEmail.recipients,
            subject: scheduledEmail.subject,
            htmlContent: scheduledEmail.html_content,
            sender: {
              name: "רות פריסמן",
              email: "ruthprissman@gmail.com"
            }
          }
        });

        if (sendEmailResponse.error) {
          console.error('Error sending email:', sendEmailResponse.error);
          
          // Mark as failed
          await supabaseClient
            .from('scheduled_emails')
            .update({ 
              status: 'failed',
              error_message: sendEmailResponse.error.message || 'שגיאה בשליחת המייל'
            })
            .eq('id', scheduledEmail.id);
          
          errorCount++;
        } else {
          console.log('Email sent successfully');
          
          // Mark as sent
          await supabaseClient
            .from('scheduled_emails')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', scheduledEmail.id);
          
          // If this was an article email, log it in email_logs
          if (scheduledEmail.article_id) {
            const emailLogs = scheduledEmail.recipients.map(recipient => ({
              article_id: scheduledEmail.article_id,
              email: recipient,
              status: 'sent'
            }));

            await supabaseClient
              .from('email_logs')
              .insert(emailLogs);
          }
          
          processedCount++;
        }

      } catch (emailError) {
        console.error(`Error processing email ${scheduledEmail.id}:`, emailError);
        
        // Mark as failed
        await supabaseClient
          .from('scheduled_emails')
          .update({ 
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : 'שגיאה לא צפויה'
          })
          .eq('id', scheduledEmail.id);
        
        errorCount++;
      }
    }

    console.log(`Processed ${processedCount} emails successfully, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: processedCount,
        failed: errorCount,
        message: `עובדו ${processedCount} מיילים בהצלחה, ${errorCount} נכשלו`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in process-scheduled-emails function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'שגיאה לא צפויה'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);