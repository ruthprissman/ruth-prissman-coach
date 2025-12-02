import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  firstName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: RequestBody = await req.json();
    console.log(`Sending pre-pray sample to: ${email}`);

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get file URLs from storage
    const { data: mp3Data } = supabase.storage
      .from("pre-pray-samples")
      .getPublicUrl("Day1.mp3");

    const { data: pdfData } = supabase.storage
      .from("pre-pray-samples")
      .getPublicUrl("Day1.pdf");

    if (!mp3Data?.publicUrl || !pdfData?.publicUrl) {
      throw new Error("Failed to get file URLs from storage");
    }

    // Fetch files as base64
    const [mp3Response, pdfResponse] = await Promise.all([
      fetch(mp3Data.publicUrl),
      fetch(pdfData.publicUrl),
    ]);

    const [mp3Buffer, pdfBuffer] = await Promise.all([
      mp3Response.arrayBuffer(),
      pdfResponse.arrayBuffer(),
    ]);

    const mp3Base64 = btoa(String.fromCharCode(...new Uint8Array(mp3Buffer)));
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Heebo', Arial, sans-serif;
      line-height: 1.8;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #5FA6A6;
      font-size: 26px;
      margin-bottom: 20px;
      text-align: center;
    }
    .content-section {
      background-color: #f0f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-right: 4px solid #5FA6A6;
    }
    .icon {
      font-size: 24px;
      margin-left: 8px;
    }
    .item {
      margin: 15px 0;
      padding-right: 10px;
    }
    .divider {
      border-top: 2px solid #e0e0e0;
      margin: 25px 0;
    }
    .steps {
      background-color: #fff5f8;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .step {
      margin: 12px 0;
      font-size: 16px;
    }
    .cta-section {
      text-align: center;
      margin: 30px 0;
      padding: 25px;
      background: linear-gradient(135deg, #5FA6A6 0%, #8C4FB9 100%);
      border-radius: 12px;
    }
    .cta-button {
      display: inline-block;
      background-color: #ffffff;
      color: #5FA6A6;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 18px;
      margin-top: 15px;
      transition: all 0.3s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .signature {
      text-align: right;
      margin-top: 30px;
      font-size: 16px;
      color: #666;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #888;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>היום הראשון שלך במתנה – דקה לפני התפילה 🎁</h1>
    
    <p style="font-size: 18px; text-align: center; color: #5FA6A6; font-weight: bold;">
      שלום ${firstName},
    </p>
    
    <p style="font-size: 16px; text-align: center;">
      שמחה שהחלטת לנסות 💜
    </p>
    
    <div class="content-section">
      <p style="font-weight: bold; font-size: 18px; margin-bottom: 15px;">
        מצורפים אליך התכנים של היום הראשון מתוך התוכנית "דקה לפני התפילה – ברכות השחר":
      </p>
      
      <div class="item">
        <span class="icon">📄</span>
        <strong>דף עבודה</strong> – "הנותן לשכוי בינה"
      </div>
      
      <div class="item">
        <span class="icon">🎧</span>
        <strong>הקלטה מלווה</strong> – 2 דקות להתחברות
      </div>
    </div>
    
    <p style="font-size: 16px; line-height: 1.8; margin: 20px 0;">
      ביום הראשון נצלול לברכה <strong>"הנותן לשכוי בינה"</strong> – 
      הברכה שמלמדת אותנו להודות על היכולת להבחין בין לילה ליום,
      על בינת הלב שמלווה אותנו בכל בוקר מחדש.
    </p>
    
    <div class="divider"></div>
    
    <div class="steps">
      <h3 style="color: #5FA6A6; margin-bottom: 15px;">✨ מה עושים עם התכנים?</h3>
      
      <div class="step">
        <strong>1.</strong> קראי את דף העבודה (2-3 דקות)
      </div>
      
      <div class="step">
        <strong>2.</strong> הקשיבי להקלטה בזמן נוח לך (2 דקות)
      </div>
      
      <div class="step">
        <strong>3.</strong> בתפילת הבוקר – שימי לב לברכה הזו ותנסי לחוש אותה מחדש
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="cta-section">
      <p style="color: white; font-size: 20px; font-weight: bold; margin-bottom: 10px;">
        💜 רוצה להמשיך את המסע?
      </p>
      
      <p style="color: white; font-size: 16px; margin-bottom: 20px;">
        אם הרגשת שהתוכן הזה מדבר אליך,<br>
        התוכנית המלאה מחכה לך עם 20 ימים של תכנים מעמיקים כאלה.
      </p>
      
      <a href="https://ruthprissman.co.il/pre-pray-payment" class="cta-button">
        לרכישת התוכנית המלאה ←
      </a>
    </div>
    
    <div class="signature">
      <p>מחכה לך,<br><strong>רות</strong></p>
      
      <p style="font-size: 14px; color: #888; margin-top: 15px;">
        P.S. אם יש לך שאלות, אני כאן – 
        <a href="mailto:ruth@ruthprissman.co.il" style="color: #5FA6A6; text-decoration: none;">
          ruth@ruthprissman.co.il
        </a>
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 רות פריסמן - מאמנת רגשית</p>
      <p style="margin-top: 10px;">
        <a href="https://ruthprissman.co.il" style="color: #5FA6A6; text-decoration: none;">
          ruthprissman.co.il
        </a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Brevo
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "רות פריסמן",
          email: "ruth@ruthprissman.co.il",
        },
        to: [{ email, name: firstName }],
        subject: "היום הראשון שלך במתנה – דקה לפני התפילה 🎁",
        htmlContent,
        attachment: [
          {
            name: "Day1.pdf",
            content: pdfBase64,
          },
          {
            name: "Day1.mp3",
            content: mp3Base64,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Brevo API error:", errorText);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    console.log(`✅ Sample email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-prepray-sample function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
