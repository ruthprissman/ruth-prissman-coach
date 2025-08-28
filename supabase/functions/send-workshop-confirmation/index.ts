import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkshopConfirmationRequest {
  fullName: string;
  email: string;
  phone?: string;
}

const generateWorkshopConfirmationHTML = (fullName: string): string => {
  const firstName = fullName.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>רישום לסדנה אושר - רות פריסמן</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f5ff; color: #333; line-height: 1.6;">
      
      <!-- Header -->
      <table style="width: 100%; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
        <tr>
          <td>
            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🎉 נרשמת בהצלחה!
            </h1>
            <p style="margin: 12px 0 0 0; color: #e9d8fd; font-size: 18px; font-weight: 300;">
              ${firstName ? `${firstName} יקרה,` : 'יקרה,'} אני מחכה לך בסדנה
            </p>
          </td>
        </tr>
      </table>

      <!-- Main Content -->
      <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="padding: 40px 30px;">
            
            <!-- Welcome Message -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #7c3aed; font-size: 24px; font-weight: bold;">
                חיבורים חדשים למילים מוכרות
              </h2>
              <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.8;">
                תודה שהרשמת לסדנה החינמית שלי! אני כל כך נרגשת לפגוש אותך ולחלוק איתך כלים עמוקים ומעשיים
                להפוך את התפילה לחוויה משמעותית ומחברת.
              </p>
            </div>

            <!-- Workshop Details -->
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; margin-bottom: 40px; border-right: 4px solid #7c3aed;">
              <h3 style="margin: 0 0 20px 0; color: #7c3aed; font-size: 20px; font-weight: bold; text-align: center;">
                📅 פרטי הסדנה
              </h3>
              
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: #7c3aed; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">📅</span>
                  <div>
                    <strong style="color: #333; font-size: 16px;">תאריך:</strong>
                    <span style="color: #666; margin-right: 8px;">יום ראשון יד׳ אלול • 7.9.25</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: #d97706; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">⏰</span>
                  <div>
                    <strong style="color: #333; font-size: 16px;">שעה:</strong>
                    <span style="color: #666; margin-right: 8px;">21:30</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: #059669; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">💻</span>
                  <div>
                    <strong style="color: #333; font-size: 16px;">פלטפורמה:</strong>
                    <span style="color: #666; margin-right: 8px;">זום</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: #dc2626; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">⏱️</span>
                  <div>
                    <strong style="color: #333; font-size: 16px;">משך:</strong>
                    <span style="color: #666; margin-right: 8px;">שעה וחצי</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Important Note -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 12px; padding: 24px; margin-bottom: 40px; text-align: center; border: 2px solid #f59e0b;">
              <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: bold;">
                📧 חשוב לדעת
              </h4>
              <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6;">
                לינק הזום לסדנה יישלח אלייך במייל נפרד 
                <strong>24 שעות לפני הסדנה</strong>
              </p>
            </div>

            <!-- What to Expect -->
            <div style="margin-bottom: 40px;">
              <h3 style="margin: 0 0 20px 0; color: #7c3aed; font-size: 20px; font-weight: bold; text-align: center;">
                💜 מה מחכה לך בסדנה
              </h3>
              
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: start; gap: 12px;">
                  <span style="color: #7c3aed; font-size: 20px; margin-top: 2px;">✨</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    <strong>פרשנויות מרענות</strong> למילות התפילה שיחזירו להן את הקסם והמשמעות
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; gap: 12px;">
                  <span style="color: #d97706; font-size: 20px; margin-top: 2px;">🎯</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    <strong>כלים יישומיים</strong> שתוכלי להשתמש בהם מיד בתפילות שלך
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; gap: 12px;">
                  <span style="color: #059669; font-size: 20px; margin-top: 2px;">📖</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    <strong>תובנות וגילויים</strong> חדשים שיעשירו את החוויה הרוחנית שלך
                  </p>
                </div>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 30px;">
              <p style="margin: 0 0 20px 0; color: #666; font-size: 16px;">
                בינתיים, אשמח שתכירי את התוכן הנוסף שלי:
              </p>
              
              <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
                <a href="https://coach.ruthprissman.co.il/subscribe" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 0 8px 8px 0;">
                  📬 הירשמי לרשימת התפוצה
                </a>
                
                <a href="https://coach.ruthprissman.co.il/" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 0 8px 8px 0;">
                  🌟 גלי את כל התוכן באתר
                </a>
              </div>
            </div>

          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table style="width: 100%; background-color: #f8f5ff; padding: 30px 20px; text-align: center;">
        <tr>
          <td>
            <p style="margin: 0 0 12px 0; color: #666; font-size: 16px; font-weight: bold;">
              רות פריסמן - מאמנת רוחנית ומנטורית
            </p>
            <p style="margin: 0 0 16px 0; color: #888; font-size: 14px;">
              📧 ruthprissman@gmail.com • 📱 055-6620273
            </p>
            <p style="margin: 0; color: #888; font-size: 12px; line-height: 1.5;">
              מייל זה נשלח אליך כי נרשמת לסדנה החינמית שלי.<br>
              לכל שאלה או בקשה להסרה מהרשימה, פני אליי במייל או בטלפון.
            </p>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};

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

    const requestData: WorkshopConfirmationRequest = await req.json();
    console.log('Received workshop confirmation request:', {
      fullName: requestData.fullName,
      email: requestData.email,
      hasPhone: !!requestData.phone
    });

    // Validate request data
    if (!requestData.fullName || !requestData.email) {
      return new Response(
        JSON.stringify({ error: 'Full name and email are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Generate HTML content
    const htmlContent = generateWorkshopConfirmationHTML(requestData.fullName);
    const firstName = requestData.fullName.split(' ')[0];
    const subject = `${firstName ? `${firstName},` : ''} רישום לסדנה אושר - חיבורים חדשים למילים מוכרות 🎉`;

    // Prepare Brevo email payload
    const brevoPayload = {
      sender: {
        name: "רות פריסמן",
        email: "ruthprissman@gmail.com"
      },
      to: [{ 
        email: requestData.email,
        name: requestData.fullName
      }],
      subject: subject,
      htmlContent: htmlContent
    };

    console.log('Sending workshop confirmation email to:', requestData.email);

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
          error: 'Failed to send confirmation email',
          details: responseData 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Workshop confirmation email sent successfully to:', requestData.email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Workshop confirmation email sent successfully',
        messageId: responseData.messageId
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-workshop-confirmation function:', error);
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