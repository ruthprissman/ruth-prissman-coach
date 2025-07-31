import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleEmailRequest {
  recipients: string[];
  subject: string;
  htmlContent: string;
  articleId?: number;
  scheduledDatetime: string;
}

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

    const { recipients, subject, htmlContent, articleId, scheduledDatetime }: ScheduleEmailRequest = await req.json();

    console.log('Scheduling email:', { recipients: recipients.length, subject, articleId, scheduledDatetime });

    // Validate input
    if (!recipients || recipients.length === 0) {
      throw new Error('לא צוינו נמענים');
    }

    if (!subject) {
      throw new Error('לא צוין נושא המייל');
    }

    if (!htmlContent) {
      throw new Error('לא צוין תוכן המייל');
    }

    if (!scheduledDatetime) {
      throw new Error('לא צוין מועד השליחה');
    }

    // Check if scheduled datetime is in the future
    const scheduledDate = new Date(scheduledDatetime);
    if (scheduledDate <= new Date()) {
      throw new Error('לא ניתן לתזמן שליחה בעבר');
    }

    // Insert scheduled email into database
    const { data, error } = await supabaseClient
      .from('scheduled_emails')
      .insert({
        recipients,
        subject,
        html_content: htmlContent,
        article_id: articleId,
        scheduled_datetime: scheduledDatetime,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('שגיאה בשמירת המייל המתוזמן');
    }

    console.log('Email scheduled successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduledEmailId: data.id,
        message: 'המייל נתזמן בהצלחה'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in schedule-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'שגיאה לא צפויה'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);