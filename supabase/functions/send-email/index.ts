
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  emailList: string[];
  subject: string;
  sender: {
    email: string;
    name: string;
  };
  htmlContent: string;
  attachments?: Array<{
    filename: string;
    url: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const emailData: EmailRequest = await req.json();
    console.log('Received email request:', {
      emailListLength: emailData.emailList?.length,
      subject: emailData.subject,
      sender: emailData.sender,
      contentLength: emailData.htmlContent?.length,
      hasAttachments: !!emailData.attachments && emailData.attachments.length > 0
    });

    // Validate request data
    if (!emailData.emailList || !Array.isArray(emailData.emailList) || emailData.emailList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Email list is required and must be a non-empty array' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!emailData.subject || !emailData.htmlContent) {
      return new Response(
        JSON.stringify({ error: 'Subject and htmlContent are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Prepare recipients for Brevo format
    const to = emailData.emailList.map(email => ({ email }));

    // Process attachments if provided
    let brevoAttachments = undefined;
    if (emailData.attachments && emailData.attachments.length > 0) {
      console.log('Processing attachments:', emailData.attachments.length);
      
      brevoAttachments = [];
      for (const attachment of emailData.attachments) {
        try {
          console.log('Fetching attachment from URL:', attachment.url);
          
          // Create a more robust fetch with proper error handling
          const fileResponse = await fetch(attachment.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Supabase-Functions/1.0'
            }
          });
          
          if (!fileResponse.ok) {
            console.error('Failed to fetch attachment:', {
              url: attachment.url,
              status: fileResponse.status,
              statusText: fileResponse.statusText
            });
            continue;
          }
          
          // Get the file as array buffer
          const fileBuffer = await fileResponse.arrayBuffer();
          const uint8Array = new Uint8Array(fileBuffer);
          
          // Convert to base64 more safely
          let binary = '';
          const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64Content = btoa(binary);
          
          brevoAttachments.push({
            name: attachment.filename,
            content: base64Content
          });
          
          console.log('Successfully processed attachment:', attachment.filename, 'Size:', uint8Array.length, 'bytes');
        } catch (attachmentError) {
          console.error('Error processing attachment:', attachment.filename, attachmentError);
          // Continue with other attachments
        }
      }
    }

    // Prepare Brevo email payload
    const brevoPayload: any = {
      sender: {
        name: emailData.sender.name,
        email: emailData.sender.email
      },
      to: to,
      subject: emailData.subject,
      htmlContent: emailData.htmlContent
    };

    // Add attachments if any were successfully processed
    if (brevoAttachments && brevoAttachments.length > 0) {
      brevoPayload.attachment = brevoAttachments;
      console.log('Added attachments to payload:', brevoAttachments.length);
    }

    console.log('Sending email via Brevo API to:', to.length, 'recipients');

    // Send email via Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify(brevoPayload)
    });

    const responseData = await brevoResponse.json();
    
    console.log('Brevo API response:', {
      status: brevoResponse.status,
      statusText: brevoResponse.statusText,
      data: responseData
    });

    if (!brevoResponse.ok) {
      console.error('Brevo API error:', responseData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: responseData 
        }),
        { 
          status: brevoResponse.status, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Email sent successfully via Brevo');
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.messageId,
        sentTo: emailData.emailList.length,
        attachmentsProcessed: brevoAttachments?.length || 0
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
