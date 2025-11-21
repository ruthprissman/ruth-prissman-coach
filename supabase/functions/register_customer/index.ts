import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Received request to register_customer');
    
    const { full_name, email, phone } = await req.json();
    console.log(`📝 Data received: name=${full_name}, email=${email}, phone=${phone}`);

    if (!email) {
      console.error('❌ Email is required');
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Checking if lead already exists...');
    
    // בדיקה אם הלקוח כבר קיים
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .eq('source', 'pre-pray')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing lead:', checkError);
      throw checkError;
    }

    if (existingLead) {
      console.log(`✅ Customer already registered with id: ${existingLead.id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Customer already registered',
          customer_id: existingLead.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('💾 Creating new lead in database...');
    
    // יצירת לקוח חדש
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name: full_name,
        email: email,
        phone: phone,
        source: 'pre-pray',
        status: 'new',
        content_type: 'workshop'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating lead:', insertError);
      throw insertError;
    }

    console.log(`✅ Successfully registered customer with id: ${newLead.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Customer registered successfully',
        customer_id: newLead.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in register_customer function:', error);
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
});
