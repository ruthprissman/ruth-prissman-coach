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
    console.log('📧 Marketing email request received:', {
      emailListLength: emailData.emailList?.length,
      subject: emailData.subject,
      sender: emailData.sender,
      contentLength: emailData.htmlContent?.length,
      hasAttachments: !!emailData.attachments && emailData.attachments.length > 0
    });

    // Validate request data
    if (!emailData.emailList || !Array.isArray(emailData.emailList) || emailData.emailList.length === 0) {
      console.error('Invalid email list:', emailData.emailList);
      return new Response(
        JSON.stringify({ error: 'Email list is required and must be a non-empty array' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!emailData.subject || !emailData.htmlContent) {
      console.error('Missing required fields:', {
        hasSubject: !!emailData.subject,
        hasHtmlContent: !!emailData.htmlContent
      });
      return new Response(
        JSON.stringify({ error: 'Subject and htmlContent are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!emailData.sender || !emailData.sender.email || !emailData.sender.name) {
      console.error('Invalid sender:', emailData.sender);
      return new Response(
        JSON.stringify({ error: 'Sender email and name are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailData.emailList.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      console.error('Invalid email addresses found:', invalidEmails);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email addresses found',
          invalidEmails: invalidEmails
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Process attachments if provided (do this once, before sending)
    let brevoAttachments: Array<{ name: string; content: string }> | undefined = undefined;
    
    if (emailData.attachments && emailData.attachments.length > 0) {
      console.log('📎 Processing attachments:', emailData.attachments.length);
      brevoAttachments = [];
      
      for (const attachment of emailData.attachments) {
        try {
          console.log('Fetching attachment from URL:', attachment.url);
          
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
          
          const fileBuffer = await fileResponse.arrayBuffer();
          const uint8Array = new Uint8Array(fileBuffer);
          
          // Convert to base64 safely using chunks
          let binary = '';
          const chunkSize = 0x8000; // 32KB chunks
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64Content = btoa(binary);
          
          brevoAttachments.push({
            name: attachment.filename,
            content: base64Content
          });
          
          console.log('✅ Successfully processed attachment:', attachment.filename, 'Size:', uint8Array.length, 'bytes');
        } catch (attachmentError) {
          console.error('Error processing attachment:', attachment.filename, attachmentError);
        }
      }
    }

    // PARALLEL BATCH SENDING - Send emails in batches for efficiency
    const BATCH_SIZE = 10;
    const totalEmails = emailData.emailList.length;
    const totalBatches = Math.ceil(totalEmails / BATCH_SIZE);
    
    console.log(`🚀 Starting parallel batch sending: ${totalEmails} emails in ${totalBatches} batches of ${BATCH_SIZE}`);

    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, totalEmails);
      const batch = emailData.emailList.slice(start, end);
      
      console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} emails: ${start + 1}-${end})`);
      
      // Send all emails in this batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (email) => {
          try {
            const brevoPayload: any = {
              sender: {
                name: emailData.sender.name,
                email: emailData.sender.email
              },
              to: [{ email: email }],
              subject: emailData.subject,
              htmlContent: emailData.htmlContent
            };

            if (brevoAttachments && brevoAttachments.length > 0) {
              brevoPayload.attachment = brevoAttachments;
            }

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

            if (!brevoResponse.ok) {
              console.error(`❌ Failed to send to ${email}:`, responseData);
              return { success: false, email, error: responseData.message || 'API error' };
            }

            console.log(`✅ Sent to ${email}`);
            return { success: true, email };
          } catch (error: any) {
            console.error(`❌ Error sending to ${email}:`, error.message);
            return { success: false, email, error: error.message };
          }
        })
      );

      // Count results from this batch
      for (const result of batchResults) {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          errors.push({ email: result.email, error: result.error || 'Unknown error' });
        }
      }

      console.log(`📊 Batch ${batchIndex + 1} complete. Running totals - Success: ${successCount}, Failed: ${failureCount}`);
    }

    console.log(`🎉 Marketing email sending completed! Total: ${totalEmails}, Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalEmails: totalEmails,
        successCount: successCount,
        failureCount: failureCount,
        attachmentsProcessed: brevoAttachments?.length || 0,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-marketing-email function:', error);
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
