import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkshopInvitationRequest {
  workshopId: string;
  zoomLink: string;
}

interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface Registrant {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { workshopId, zoomLink }: WorkshopInvitationRequest = await req.json();

    if (!workshopId || !zoomLink) {
      return new Response(
        JSON.stringify({ error: 'Workshop ID and Zoom link are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get workshop details
    const { data: workshop, error: workshopError } = await supabase
      .from('workshops')
      .select('*')
      .eq('id', workshopId)
      .single();

    if (workshopError || !workshop) {
      console.error('Error fetching workshop:', workshopError);
      return new Response(
        JSON.stringify({ error: 'Workshop not found' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Get registrants for the workshop
    const { data: registrants, error: registrantsError } = await supabase
      .from('registrations')
      .select('*')
      .eq('workshop_id', workshopId);

    if (registrantsError) {
      console.error('Error fetching registrants:', registrantsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch registrants' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!registrants || registrants.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No registrants found for this workshop' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Format workshop date
    const workshopDate = new Date(workshop.date);
    const formattedDate = workshopDate.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = workshopDate.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Prepare emails to send
    const emailPromises = registrants.map(async (registrant: Registrant) => {
      const emailData = {
        sender: {
          name: "רות פריסמן",
          email: "ruth@ruthprissman.co.il"
        },
        to: [{
          email: registrant.email,
          name: registrant.full_name
        }],
        subject: `זימון לסדנה: ${workshop.title}`,
        htmlContent: `
          <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2c5aa0;">שלום ${registrant.full_name},</h2>
            
            <p>אני שמחה להזמין אותך לסדנה:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c5aa0; margin-top: 0;">${workshop.title}</h3>
              <p><strong>תאריך:</strong> ${formattedDate}</p>
              <p><strong>שעה:</strong> ${formattedTime}</p>
              <p><strong>תיאור:</strong> ${workshop.description}</p>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2c5aa0; margin-top: 0;">פרטי התחברות לזום:</h4>
              <p><a href="${zoomLink}" style="color: #2c5aa0; text-decoration: none; font-weight: bold;">${zoomLink}</a></p>
            </div>
            
            <p>אני מצפה לראות אותך בסדנה!</p>
            
            <p>בברכה,<br>
            רות פריסמן<br>
            <a href="mailto:ruthprissman@gmail.com" style="color: #2c5aa0;">ruthprissman@gmail.com</a></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              הודעה זו נשלחה אליך כי נרשמת לסדנה. אם אינך מעוניין/ת לקבל הודעות נוספות, 
              אנא פנה/י אלינו במייל.
            </p>
          </div>
        `
      };

      // Send email via Brevo
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('BREVO_API_KEY') ?? ''
        },
        body: JSON.stringify(emailData)
      });

      if (!brevoResponse.ok) {
        const error = await brevoResponse.text();
        console.error(`Failed to send email to ${registrant.email}:`, error);
        throw new Error(`Failed to send email to ${registrant.email}: ${error}`);
      }

      const result = await brevoResponse.json();
      console.log(`Email sent successfully to ${registrant.email}:`, result);
      
      return {
        email: registrant.email,
        name: registrant.full_name,
        success: true,
        messageId: result.messageId
      };
    });

    // Send all emails
    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected');
    
    if (failed.length > 0) {
      console.error('Some emails failed to send:', failed);
    }

    console.log(`Workshop invitation emails sent. Successful: ${successful}, Failed: ${failed.length}`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully sent ${successful} emails out of ${registrants.length} total`,
        successful,
        failed: failed.length,
        workshopTitle: workshop.title
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-workshop-invitations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);