
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = "https://vbrnyndzprufhtrwujdh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicm55bmR6cHJ1Zmh0cnd1amRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY2NjE1MywiZXhwIjoyMDY0MjQyMTUzfQ.j7Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z";

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        amount: number;
        currency: string;
        method: string;
        captured: boolean;
        email: string;
        contact: string;
        created_at: number;
        notes?: {
          email?: string;
          phone?: string;
        };
      };
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received webhook request');
    
    const webhookPayload: RazorpayWebhookPayload = await req.json();
    console.log('Webhook payload received for event:', webhookPayload.event);

    if (webhookPayload.event !== 'payment.captured') {
      console.log('Ignoring non-payment.captured event:', webhookPayload.event);
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = webhookPayload.payload.payment.entity;
    console.log('Processing payment:', payment.id, 'for order:', payment.order_id);

    const paymentEmail = payment.email || payment.notes?.email;
    const paymentPhone = payment.contact || payment.notes?.phone;

    console.log('Payment details - Email:', paymentEmail, 'Phone:', paymentPhone);

    // Update payment record to completed
    const { data: paymentRecord, error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        razorpay_payment_id: payment.id,
        verified_at: new Date().toISOString()
      })
      .eq('email', paymentEmail)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment record:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Payment record updated:', paymentRecord.id);

    // Find user by email and grant access
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', paymentEmail)
      .single();

    if (user && !userError) {
      console.log('Found user:', user.id, 'granting access...');
      
      // Grant access to digital-product-1 using service role to bypass RLS
      const { error: accessError } = await supabase
        .from('user_product_access')
        .upsert({
          user_id: user.id,
          product_id: 'digital-product-1',
          payment_id: paymentRecord.id
        }, {
          onConflict: 'user_id,product_id'
        });

      if (accessError) {
        console.error('Error granting access:', accessError);
      } else {
        console.log('Access granted successfully to user:', user.id);
      }
    } else {
      console.log('User not found for email:', paymentEmail);
    }

    return new Response(JSON.stringify({ 
      message: 'Payment processed successfully',
      payment_id: payment.id,
      email: paymentEmail,
      user_found: !!user,
      access_granted: user && !userError
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in razorpay-webhook function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
