import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkshopInvitationRequest {
  workshopId: string;
  zoomLink: string;
  attachWorksheet?: boolean;
}

interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  invitation_subject: string;
  invitation_body: string;
  worksheet_file_path?: string;
  worksheet_file_name?: string;
  worksheet_file_size?: number;
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
    const { workshopId, zoomLink, attachWorksheet = false }: WorkshopInvitationRequest = await req.json();

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

    // Get workshop PDF if it should be attached
    let worksheetData: ArrayBuffer | null = null;
    if (attachWorksheet && workshop.worksheet_file_path) {
      try {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('workshop_files')
          .download(workshop.worksheet_file_path);
        
        if (fileError) {
          console.log(`Could not download worksheet: ${fileError.message}`);
        } else {
          worksheetData = await fileData.arrayBuffer();
          console.log(`Downloaded worksheet: ${workshop.worksheet_file_name}, size: ${worksheetData.byteLength} bytes`);
        }
      } catch (error) {
        console.log(`Error downloading worksheet: ${error}`);
      }
    }

    // Prepare emails to send
    const emailPromises = registrants.map(async (registrant: Registrant) => {
      // Replace template variables in subject and body
      const subject = workshop.invitation_subject
        .replace(/\{workshop_title\}/g, workshop.title)
        .replace(/\{participant_name\}/g, registrant.full_name)
        .replace(/\{workshop_date\}/g, formattedDate)
        .replace(/\{workshop_time\}/g, formattedTime)
        .replace(/\{zoom_link\}/g, zoomLink);

      const bodyText = workshop.invitation_body
        .replace(/\{workshop_title\}/g, workshop.title)
        .replace(/\{participant_name\}/g, registrant.full_name)
        .replace(/\{workshop_date\}/g, formattedDate)
        .replace(/\{workshop_time\}/g, formattedTime)
        .replace(/\{zoom_link\}/g, zoomLink);

      // Convert line breaks to HTML and wrap in proper HTML structure
      const htmlContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          ${bodyText.replace(/\n/g, '<br>')}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #2c5aa0;">
            <p style="margin: 0; font-weight: bold; color: #2c5aa0; font-size: 18px;">רות פריסמן</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">מאמנת בגישה טיפולית | קוד הנפש | SEFT</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">מבט חדש על חיים מוכרים</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">צמיחה אישית | זוגית | ילדים | טראומות</p>
            
            <div style="margin-top: 15px;">
              <p style="margin: 2px 0; color: #2c5aa0; font-size: 14px;">
                📧 <a href="mailto:ruth@ruthprissman.co.il" style="color: #2c5aa0; text-decoration: none;">Ruth@RuthPrissman.co.il</a>
              </p>
              <p style="margin: 2px 0; color: #2c5aa0; font-size: 14px;">📱 0556620273</p>
              <p style="margin: 2px 0; color: #2c5aa0; font-size: 14px;">
                🌐 <a href="https://coach.ruthprissman.co.il" style="color: #2c5aa0; text-decoration: none;">https://coach.ruthprissman.co.il</a>
              </p>
            </div>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            הודעה זו נשלחה אליך כי נרשמת לסדנה. אם אינך מעוניין/ת לקבל הודעות נוספות, 
            אנא פנה/י אלינו במייל.
          </p>
        </div>
      `;

      const emailData = {
        sender: {
          name: "רות פריסמן",
          email: "ruth@ruthprissman.co.il"
        },
        to: [{
          email: registrant.email,
          name: registrant.full_name
        }],
        subject: subject,
        htmlContent: htmlContent,
        ...(worksheetData && workshop.worksheet_file_name && {
          attachment: [{
            content: btoa(String.fromCharCode(...new Uint8Array(worksheetData))),
            name: workshop.worksheet_file_name
          }]
        })
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