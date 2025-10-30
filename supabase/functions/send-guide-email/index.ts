import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  firstName: string;
  pdfUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const { email, firstName, pdfUrl }: EmailRequest = await req.json();

    console.log('Sending guide email to:', email);

    // Generate HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background-color: #f8f5f2;
      direction: rtl;
      text-align: right;
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      padding: 40px 30px;
    }
    .header { 
      text-align: center; 
      color: #6B46C1; 
      margin-bottom: 30px; 
      border-bottom: 2px solid #E9D8FD;
      padding-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .content { 
      color: #2D3748; 
      line-height: 1.8; 
      font-size: 16px; 
    }
    .highlight { 
      background-color: #E9D8FD; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0;
      border-right: 4px solid #6B46C1;
    }
    .highlight strong {
      color: #6B46C1;
      font-size: 18px;
    }
    ul {
      margin: 15px 0;
      padding-right: 20px;
    }
    ul li {
      margin-bottom: 10px;
    }
    .footer { 
      text-align: center; 
      color: #718096; 
      font-size: 14px; 
      margin-top: 40px; 
      border-top: 1px solid #E2E8F0;
      padding-top: 20px;
    }
    .footer a {
      color: #6B46C1;
      text-decoration: none;
    }
    .signature {
      margin-top: 30px;
      font-style: italic;
      color: #4A5568;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>שלום ${firstName}! 🙏</h1>
      <p style="margin: 0; color: #805AD5; font-size: 18px;">המדריך שלך כאן - מצורף למייל הזה</p>
    </div>
    
    <div class="content">
      <p>שמחתי שהחלטת להצטרף!</p>
      
      <div class="highlight">
        <strong>📎 המדריך מצורף למייל הזה</strong><br>
        <span style="font-size: 16px;">"להתפלל כשאין זמן – סדר קדימויות התפילה לנשים"</span>
      </div>
      
      <p><strong>במדריך תמצאי:</strong></p>
      <ul>
        <li>✨ סדר קדימויות ברור לתפילה</li>
        <li>⏰ על מה מדלגים קודם כשהזמן קצר</li>
        <li>💫 איך להפוך תפילה לחוויה של חיבור</li>
      </ul>
      
      <p>בכל שבוע תקבלי ממני מייל קצר עם <strong>"חיבורים קטנים"</strong> - רעיונות מעשיים לחיים רוחניים משמעותיים, בלי הפרזות ובלי לחץ.</p>
      
      <p>אני כאן בשבילך בכל שאלה או רעיון שעולה.</p>
      
      <p class="signature">בברכה,<br>רות פריסמן</p>
    </div>
    
    <div class="footer">
      <p>קיבלת את המייל הזה כי נרשמת לקבלת תכנים מרות פריסמן</p>
      <p>רוצה להסיר את עצמך? <a href="https://ruthprissman.co.il/unsubscribe">לחצי כאן</a></p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Fetch the PDF file
    console.log('Fetching PDF from:', pdfUrl);
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    // Convert ArrayBuffer to base64 in chunks to avoid stack overflow
    const bytes = new Uint8Array(pdfBuffer);
    let binary = '';
    const chunkSize = 8192; // Process in chunks
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const pdfBase64 = btoa(binary);

    // Send email via Brevo
    const brevoPayload = {
      sender: {
        name: 'רות פריסמן',
        email: 'ruthprissman@gmail.com'
      },
      to: [
        {
          email: email,
          name: firstName
        }
      ],
      subject: 'המדריך שלך בדרך! – להורדה: להתפלל כשאין זמן',
      htmlContent: htmlContent,
      attachment: [
        {
          name: 'מדריך-תפילה-רות-פריסמן.pdf',
          content: pdfBase64
        }
      ]
    };

    console.log('Sending email via Brevo...');
    const brevoResponse = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(brevoPayload)
    });

    const responseData = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error('Brevo API error:', responseData);
      throw new Error(`Brevo API error: ${JSON.stringify(responseData)}`);
    }

    console.log('Email sent successfully:', responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: responseData.messageId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in send-guide-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
