
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "https://vbrnyndzprufhtrwujdh.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";

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
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [RAZORPAY-WEBHOOK] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('=== WEBHOOK REQUEST RECEIVED ===');
    
    const webhookPayload: RazorpayWebhookPayload = await req.json();
    logStep('Raw webhook payload received', webhookPayload);

    // Handle payment events
    if (!['payment.captured', 'payment.authorized', 'order.paid', 'payment.failed'].includes(webhookPayload.event)) {
      logStep('Ignoring non-payment event', { event: webhookPayload.event });
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = webhookPayload.payload.payment.entity;
    logStep('Processing payment entity', { 
      paymentId: payment.id, 
      orderId: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      captured: payment.captured,
      email: payment.email,
      contact: payment.contact
    });

    // Extract email with multiple fallbacks
    const paymentEmail = payment.email || 
                        payment.notes?.email || 
                        payment.notes?.customer_email;
    const paymentPhone = payment.contact || payment.notes?.phone;

    logStep('Extracted payment details', { 
      email: paymentEmail, 
      phone: paymentPhone,
      allNotes: payment.notes 
    });

    if (!paymentEmail) {
      logStep('CRITICAL ERROR: No email found in payment data');
      return new Response(JSON.stringify({ 
        error: 'No email found in payment',
        payment_data: payment
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced payment record finding strategy
    let paymentRecord = null;
    let searchMethod = '';

    // Strategy 1: Find by Razorpay order ID
    if (payment.order_id) {
      logStep('Searching by Razorpay order ID', { orderId: payment.order_id });
      const { data: orderData, error: orderError } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', payment.order_id)
        .single();

      if (orderData && !orderError) {
        paymentRecord = orderData;
        searchMethod = 'order_id';
        logStep('Found payment by order ID', { paymentId: paymentRecord.id });
      } else {
        logStep('No payment found by order ID', { error: orderError?.message });
      }
    }

    // Strategy 2: Find most recent pending payment by email
    if (!paymentRecord) {
      logStep('Searching by email for pending payments', { email: paymentEmail });
      const { data: emailData, error: emailError } = await supabase
        .from('payments')
        .select('*')
        .eq('email', paymentEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (emailData && emailData.length > 0) {
        paymentRecord = emailData[0];
        searchMethod = 'email_pending';
        logStep('Found pending payment by email', { paymentId: paymentRecord.id });
      } else {
        logStep('No pending payment found by email', { error: emailError?.message });
      }
    }

    // Strategy 3: Find any recent payment by email (within last hour)
    if (!paymentRecord) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      logStep('Searching for recent payment by email', { email: paymentEmail, since: oneHourAgo });
      
      const { data: recentData, error: recentError } = await supabase
        .from('payments')
        .select('*')
        .eq('email', paymentEmail)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentData && recentData.length > 0) {
        paymentRecord = recentData[0];
        searchMethod = 'email_recent';
        logStep('Found recent payment by email', { paymentId: paymentRecord.id });
      } else {
        logStep('No recent payment found by email', { error: recentError?.message });
      }
    }

    // Strategy 4: Create new payment record if none found
    if (!paymentRecord) {
      logStep('Creating new payment record for webhook payment');
      
      const newPaymentData = {
        email: paymentEmail,
        mobile_number: paymentPhone || '',
        amount: payment.amount / 100, // Convert paise to rupees
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id || null,
        status: payment.captured && payment.status === 'captured' ? 'completed' : 'pending',
        google_drive_link: "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link",
        verified_at: payment.captured && payment.status === 'captured' ? new Date().toISOString() : null
      };

      logStep('Inserting new payment record', newPaymentData);
      
      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert(newPaymentData)
        .select()
        .single();

      if (createError) {
        logStep('ERROR creating new payment record', { error: createError });
        return new Response(JSON.stringify({ 
          error: 'Failed to create payment record',
          details: createError
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      paymentRecord = newPayment;
      searchMethod = 'created_new';
      logStep('Created new payment record successfully', { paymentId: paymentRecord.id });
    } else {
      // Update existing payment record with complete information
      logStep('Updating existing payment record', { 
        paymentId: paymentRecord.id,
        searchMethod,
        currentStatus: paymentRecord.status
      });

      const updateData = {
        razorpay_payment_id: payment.id,
        status: payment.captured && payment.status === 'captured' ? 'completed' : 'failed',
        verified_at: payment.captured && payment.status === 'captured' ? new Date().toISOString() : null,
        ...(payment.order_id && { razorpay_order_id: payment.order_id }),
        ...(paymentPhone && !paymentRecord.mobile_number && { mobile_number: paymentPhone })
      };

      logStep('Updating with data', updateData);

      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentRecord.id)
        .select()
        .single();

      if (updateError) {
        logStep('ERROR updating payment record', { error: updateError });
        return new Response(JSON.stringify({ 
          error: 'Failed to update payment',
          details: updateError
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      paymentRecord = updatedPayment;
      logStep('Updated payment record successfully', { 
        paymentId: paymentRecord.id,
        newStatus: paymentRecord.status
      });
    }

    // Grant user access if payment is completed
    if (paymentRecord.status === 'completed') {
      logStep('Payment completed, checking for user to grant access', { email: paymentEmail });
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', paymentEmail)
        .single();

      if (user && !userError) {
        logStep('Found user, granting product access', { 
          userId: user.id,
          userName: user.name
        });
        
        // Check if access already exists
        const { data: existingAccess, error: accessCheckError } = await supabase
          .from('user_product_access')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', 'digital-product-1')
          .single();

        if (!existingAccess) {
          // Grant new access
          const { data: newAccess, error: accessError } = await supabase
            .from('user_product_access')
            .insert({
              user_id: user.id,
              product_id: 'digital-product-1',
              payment_id: paymentRecord.id
            })
            .select()
            .single();

          if (accessError) {
            logStep('ERROR granting access', { error: accessError });
          } else {
            logStep('Access granted successfully', { 
              accessId: newAccess.id,
              userId: user.id,
              productId: 'digital-product-1'
            });
          }
        } else {
          logStep('Access already exists', { existingAccessId: existingAccess.id });
        }
      } else {
        logStep('User not found, cannot grant access', { 
          error: userError?.message,
          email: paymentEmail,
          suggestion: 'User needs to register first'
        });
      }
    }

    logStep('=== WEBHOOK PROCESSING COMPLETED SUCCESSFULLY ===', {
      paymentId: payment.id,
      email: paymentEmail,
      recordId: paymentRecord.id,
      status: paymentRecord.status,
      searchMethod,
      userFound: !!user,
      accessGranted: paymentRecord.status === 'completed' && !!user
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Payment processed successfully',
      data: {
        razorpay_payment_id: payment.id,
        email: paymentEmail,
        record_id: paymentRecord.id,
        status: paymentRecord.status,
        search_method: searchMethod,
        user_found: !!user,
        access_granted: paymentRecord.status === 'completed' && !!user
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep('CRITICAL ERROR in webhook processing', { 
      error: error.message, 
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
