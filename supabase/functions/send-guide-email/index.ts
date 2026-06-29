import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { checkRateLimit, clientIp, tooManyRequests } from "../_shared/rateLimit.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Escape untrusted input before interpolating it into email HTML.
const escapeHtml = (s: string): string =>
  (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

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

    // SECURITY: pdfUrl is fetched server-side; restrict it to our own public storage bucket
    // to prevent SSRF (server-side request forgery) to arbitrary internal/external URLs.
    const ALLOWED_PDF_PREFIX = 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (typeof pdfUrl !== 'string' || !pdfUrl.startsWith(ALLOWED_PDF_PREFIX)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid file URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: throttle per source IP and per target email to prevent mail-bombing / quota drain.
    const ip = clientIp(req);
    if (!(await checkRateLimit('guide-email-ip', ip, 5, 600)) ||
        !(await checkRateLimit('guide-email-email', email.toLowerCase(), 3, 3600))) {
      return tooManyRequests(corsHeaders);
    }

    console.log('Sending guide email');

    // Fetch signature image and convert to base64
    const signatureUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/ruth-signature.png';
    let signatureBase64 = '';
    
    try {
      console.log('Fetching signature image from:', signatureUrl);
      const signatureResponse = await fetch(signatureUrl);
      console.log('Signature response status:', signatureResponse.status, signatureResponse.statusText);
      
      if (signatureResponse.ok) {
        const signatureBuffer = await signatureResponse.arrayBuffer();
        const signatureBytes = new Uint8Array(signatureBuffer);
        console.log('Signature image size:', signatureBytes.byteLength, 'bytes');
        
        let signatureBinary = '';
        const chunkSize = 8192;
        for (let i = 0; i < signatureBytes.byteLength; i += chunkSize) {
          const chunk = signatureBytes.subarray(i, Math.min(i + chunkSize, signatureBytes.byteLength));
          signatureBinary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        signatureBase64 = btoa(signatureBinary);
        console.log('Signature converted to base64, length:', signatureBase64.length);
      } else {
        console.error('Failed to fetch signature:', signatureResponse.status, signatureResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching signature image:', error);
    }

    // Generate HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&display=swap');
    
    * {
      direction: rtl;
      text-align: right;
    }
    
    body { 
      font-family: 'Assistant', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background-color: #faf8ff;
      direction: rtl;
      text-align: right;
      margin: 0;
      padding: 0;
      line-height: 1.7;
    }
    .email-wrapper {
      background-color: #faf8ff;
      padding: 40px 20px;
      direction: rtl;
      text-align: right;
    }
    .container { 
      max-width: 640px; 
      margin: 0 auto; 
      background: #ffffff;
      padding: 40px 32px;
      border-radius: 16px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      direction: rtl;
      text-align: right;
    }
    .title { 
      text-align: center; 
      color: #3b2a7b;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 32px 0;
      line-height: 1.4;
    }
    .content { 
      color: #3b2a7b; 
      line-height: 1.7; 
      font-size: 16px;
      font-weight: 400;
      direction: rtl;
      text-align: right;
    }
    .content p {
      margin: 0 0 20px 0;
      direction: rtl;
      text-align: right;
    }
    .content strong {
      font-weight: 600;
      color: #5c3db3;
    }
    .signature-section {
      margin-top: 40px;
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid rgba(82, 50, 125, 0.1);
    }
    .signature-image {
      max-width: 180px;
      height: auto;
      margin: 0 auto 12px auto;
      display: block;
    }
    .signature-text {
      color: #5c3db3;
      font-size: 14px;
      font-weight: 400;
      margin: 0;
      line-height: 1.5;
    }
    .footer { 
      text-align: center; 
      color: #777; 
      font-size: 12px; 
      margin-top: 32px; 
      padding-top: 20px;
      border-top: 1px solid rgba(82, 50, 125, 0.1);
      line-height: 1.6;
    }
    .footer p {
      margin: 8px 0;
    }
    .footer a {
      color: #5c3db3;
      text-decoration: underline;
    }
    @media only screen and (max-width: 640px) {
      .container {
        padding: 32px 24px;
      }
      .title {
        font-size: 24px;
      }
      .content {
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <h1 class="title">החוברת כאן! – להתפלל כשאין זמן</h1>
      
      <div class="content">
        <p>שלום ${escapeHtml(firstName)},</p>
        
        <p>שמחה שהצטרפת 💜</p>
        
        <p>מצורף המדריך המעשי <strong>"להתפלל כשאין זמן – סדר קדימויות התפילה לנשים"</strong><br>
        שיעזור לך לראות את סדר קדימויות התפילה בצורה ברורה.<br>
        גלי על מה מדלגים קודם כשהזמן קצר, בלי לוותר על החיבור.</p>
        
        <p>בכל שבוע אשלח לך מייל עם תוכן מחבר למילים הגדולות של אנשי כנסת הגדולה –<br>
        תובנות קצרות, חיבור ללב, וקרן אור קטנה לשגרה שלך.</p>
        
        <p>אם יום אחד תרגישי שמספיק לך, תמיד תוכלי להסיר את עצמך בלחיצה אחת –<br>
        אבל אני מקווה שתישארי איתי קצת... ✨</p>
      </div>
      
      <div class="signature-section">
        <p class="signature-text" style="margin-bottom: 8px;">מחכה לך</p>
        <p class="signature-text">רות</p>
      </div>
      
      <div class="footer">
        <p>הודעה זו נשלחה אליך כי נרשמת לקבלת המדריך 'להתפלל כשאין זמן'.</p>
        <p>ניתן להסיר את עצמך בלחיצה אחת בתחתית כל מייל עתידי.</p>
      </div>
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
        email: 'ruth@ruthprissman.co.il'
      },
      to: [
        {
          email: email,
          name: firstName
        }
      ],
      subject: 'החוברת כאן! – להתפלל כשאין זמן',
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
        error: 'Failed to send email'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
