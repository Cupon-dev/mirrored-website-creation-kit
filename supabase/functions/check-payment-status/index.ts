
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = "https://vbrnyndzprufhtrwujdh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicm55bmR6cHJ1Zmh0cnd1amRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjYxNTMsImV4cCI6MjA2NDI0MjE1M30.XEQb2WI6K6bplu6O59pUhQ5QbLz16rQEDStM-yi-ocw";

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let email = null;
    let phoneNumber = null;

    // Handle both GET and POST requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      email = url.searchParams.get('email');
      phoneNumber = url.searchParams.get('phone');
    } else if (req.method === 'POST') {
      // Check if there's actually a body to parse
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const bodyText = await req.text();
        if (bodyText && bodyText.trim()) {
          try {
            const body = JSON.parse(bodyText);
            email = body.email;
            phoneNumber = body.phone;
          } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Body:', bodyText);
            return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    }

    console.log('Checking payment status for:', { email, phoneNumber });

    if (!email && !phoneNumber) {
      return new Response(JSON.stringify({ error: 'Email or phone number required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for completed payment
    let query = supabase
      .from('payments')
      .select('*')
      .eq('status', 'completed');

    if (email) {
      query = query.eq('email', email);
    } else if (phoneNumber) {
      query = query.eq('mobile_number', phoneNumber);
    }

    const { data: payments, error } = await query
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking payment status:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found payments:', payments);

    const latestPayment = payments?.[0];

    if (latestPayment) {
      // WhatsApp group link
      const whatsappGroupLink = "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X";
      
      return new Response(JSON.stringify({
        status: 'completed',
        payment_id: latestPayment.razorpay_payment_id,
        drive_link: latestPayment.google_drive_link,
        whatsapp_group: whatsappGroupLink,
        email: latestPayment.email,
        phone: latestPayment.mobile_number,
        whatsapp_sent: latestPayment.whatsapp_sent,
        delivery_method: latestPayment.delivery_method,
        whatsapp_url: latestPayment.whatsapp_url
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        status: 'pending',
        message: 'No completed payment found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in check-payment-status function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
