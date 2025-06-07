
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "https://vbrnyndzprufhtrwujdh.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          order_id?: string;
          customer_email?: string;
        };
      };
    };
  };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RAZORPAY-WEBHOOK] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('=== WEBHOOK REQUEST RECEIVED ===');
    
    const webhookPayload: RazorpayWebhookPayload = await req.json();
    logStep('Webhook event received', { event: webhookPayload.event });

    // Handle different Razorpay events
    if (!['payment.captured', 'payment.authorized', 'order.paid'].includes(webhookPayload.event)) {
      logStep('Ignoring non-payment event', { event: webhookPayload.event });
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = webhookPayload.payload.payment.entity;
    logStep('Processing payment', { 
      paymentId: payment.id, 
      orderId: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      captured: payment.captured
    });

    // Extract email from multiple sources
    const paymentEmail = payment.email || 
                        payment.notes?.email || 
                        payment.notes?.customer_email;
    const paymentPhone = payment.contact || payment.notes?.phone;

    logStep('Payment details extracted', { 
      email: paymentEmail, 
      phone: paymentPhone,
      notes: payment.notes 
    });

    if (!paymentEmail) {
      logStep('ERROR: No email found in payment data', { payment });
      return new Response(JSON.stringify({ error: 'No email found in payment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // First, try to find payment record by razorpay_order_id
    let paymentRecord = null;
    if (payment.order_id) {
      logStep('Looking for payment by order_id', { orderId: payment.order_id });
      const { data: orderData, error: orderError } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', payment.order_id)
        .single();

      if (!orderError && orderData) {
        paymentRecord = orderData;
        logStep('Found payment by order_id', { paymentId: paymentRecord.id });
      } else {
        logStep('No payment found by order_id', { error: orderError });
      }
    }

    // If not found by order_id, try to find by email and pending status
    if (!paymentRecord) {
      logStep('Looking for payment by email and pending status', { email: paymentEmail });
      const { data: emailData, error: emailError } = await supabase
        .from('payments')
        .select('*')
        .eq('email', paymentEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!emailError && emailData) {
        paymentRecord = emailData;
        logStep('Found payment by email', { paymentId: paymentRecord.id });
      } else {
        logStep('No pending payment found by email', { error: emailError });
      }
    }

    // If still not found, create a new payment record
    if (!paymentRecord) {
      logStep('Creating new payment record for captured payment');
      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert({
          email: paymentEmail,
          mobile_number: paymentPhone || '',
          amount: payment.amount / 100, // Convert paise to rupees
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          status: 'completed',
          google_drive_link: "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link",
          verified_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        logStep('ERROR creating new payment record', { error: createError });
        return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      paymentRecord = newPayment;
      logStep('Created new payment record', { paymentId: paymentRecord.id });
    } else {
      // Update existing payment record
      logStep('Updating existing payment record', { paymentId: paymentRecord.id });
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          razorpay_payment_id: payment.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id)
        .select()
        .single();

      if (updateError) {
        logStep('ERROR updating payment record', { error: updateError });
        return new Response(JSON.stringify({ error: 'Failed to update payment' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      paymentRecord = updatedPayment;
      logStep('Updated payment record successfully', { paymentId: paymentRecord.id });
    }

    // Grant user access
    logStep('Looking for user to grant access', { email: paymentEmail });
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', paymentEmail)
      .single();

    if (user && !userError) {
      logStep('Found user, granting access', { userId: user.id });
      
      // Grant access to digital-product-1
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
        logStep('ERROR granting access', { error: accessError });
      } else {
        logStep('Access granted successfully', { userId: user.id, productId: 'digital-product-1' });
      }
    } else {
      logStep('User not found or error occurred', { error: userError, email: paymentEmail });
    }

    logStep('=== WEBHOOK PROCESSING COMPLETED ===', {
      success: true,
      paymentId: payment.id,
      email: paymentEmail,
      recordId: paymentRecord.id,
      userFound: !!user
    });

    return new Response(JSON.stringify({ 
      message: 'Payment processed successfully',
      payment_id: payment.id,
      email: paymentEmail,
      record_id: paymentRecord.id,
      user_found: !!user,
      access_granted: user && !userError
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep('CRITICAL ERROR in webhook processing', { 
      error: error.message, 
      stack: error.stack 
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
