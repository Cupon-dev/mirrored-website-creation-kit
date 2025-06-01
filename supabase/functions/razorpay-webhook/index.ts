import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = "https://vbrnyndzprufhtrwujdh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicm55bmR6cHJ1Zmh0cnd1amRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjYxNTMsImV4cCI6MjA2NDI0MjE1M30.XEQb2WI6K6bplu6O59pUhQ5QbLz16rQEDStM-yi-ocw";

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

// Improved WhatsApp link generation
function createWhatsAppWebLink(phoneNumber: string, message: string) {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    console.log('Created WhatsApp web link for:', formattedPhone);
    return { success: true, url: whatsappUrl, method: 'web_link' };
  } catch (error) {
    console.error('Error creating WhatsApp web link:', error);
    return { success: false, error: error.message, method: 'web_link_failed' };
  }
}

// New function to trigger Make.com automation
async function triggerMakeAutomation(paymentData: any) {
  try {
    console.log('Triggering Make.com automation for payment:', paymentData.id);
    
    const { data, error } = await supabase.functions.invoke('make-webhook', {
      body: {
        email: paymentData.email,
        phone: paymentData.mobile_number,
        amount: paymentData.amount,
        payment_id: paymentData.razorpay_payment_id,
        drive_link: paymentData.google_drive_link,
        customer_name: paymentData.email.split('@')[0]
      }
    });

    if (error) {
      console.error('Make.com automation failed:', error);
      return { success: false, method: 'make_failed', error: error.message };
    }

    console.log('Make.com automation triggered successfully:', data);
    return { success: true, method: 'make_automation' };
    
  } catch (error) {
    console.error('Error triggering Make.com automation:', error);
    return { success: false, method: 'make_error', error: error.message };
  }
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

    let paymentRecord = null;

    // First try to find by order ID
    const { data: orderRecord, error: orderError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', payment.order_id)
      .single();

    if (orderRecord && !orderError) {
      paymentRecord = orderRecord;
      console.log('Found payment record by order ID:', paymentRecord.id);
    } else {
      console.log('Order ID not found, searching by email...');
      
      if (paymentEmail) {
        const { data: emailRecord, error: emailError } = await supabase
          .from('payments')
          .select('*')
          .eq('email', paymentEmail)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (emailRecord && !emailError) {
          paymentRecord = emailRecord;
          console.log('Found payment record by email:', paymentRecord.id);
        }
      }
    }

    if (!paymentRecord) {
      console.log('Creating new payment record from webhook data...');
      
      const driveLink = "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link";
      
      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert([{
          email: paymentEmail || 'unknown@email.com',
          mobile_number: paymentPhone || '',
          amount: payment.amount / 100,
          google_drive_link: driveLink,
          razorpay_order_id: payment.order_id,
          razorpay_payment_id: payment.id,
          status: 'completed',
          verified_at: new Date().toISOString(),
          whatsapp_sent: false
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating payment record:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      paymentRecord = newPayment;
      console.log('Created new payment record:', paymentRecord.id);
    } else {
      console.log('Updating existing payment record:', paymentRecord.id);
      
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          razorpay_payment_id: payment.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('Error updating payment record:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update payment' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Try Make.com automation first, then fallback to WhatsApp web link
    const cleanPhone = (paymentRecord.mobile_number || paymentPhone || '').replace(/\D/g, '');
    
    if (cleanPhone) {
      let deliveryMethod = 'failed';
      let deliveryUrl = null;

      // Try Make.com automation first
      const makeResult = await triggerMakeAutomation(paymentRecord);
      
      if (makeResult.success) {
        deliveryMethod = 'make_automation';
        console.log('✅ Make.com automation triggered successfully');
      } else {
        console.log('⚠️ Make.com automation failed, falling back to WhatsApp web link');
        
        // Fallback to WhatsApp web link
        const whatsappGroupLink = "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X";
        const message = `🎉 *Payment Received - Order Confirmed!* 🎉

Thank you for your purchase!

*Payment ID:* ${payment.id}
*Amount:* ₹${(payment.amount / 100).toFixed(2)}

📥 *Your Download Link:*
${paymentRecord.google_drive_link}

👥 *Join our WhatsApp Community:*
${whatsappGroupLink}

*Instructions:*
1. Click the download link above to access your content
2. Make sure you're logged into Google with: ${paymentRecord.email}
3. Join our community for updates and support

Need help? Reply to this message!

Thank you for choosing us! 🚀`;

        const webLinkResult = createWhatsAppWebLink(cleanPhone, message);
        
        if (webLinkResult.success) {
          deliveryMethod = 'web_link';
          deliveryUrl = webLinkResult.url;
          console.log('✅ WhatsApp web link created as fallback');
        }
      }

      // Update payment record with delivery status
      await supabase
        .from('payments')
        .update({ 
          whatsapp_sent: makeResult.success || deliveryMethod === 'web_link',
          delivery_method: deliveryMethod,
          whatsapp_url: deliveryUrl
        })
        .eq('id', paymentRecord.id);

      console.log('Payment processed successfully. Delivery method:', deliveryMethod);

      return new Response(JSON.stringify({ 
        message: 'Payment processed successfully',
        payment_id: payment.id,
        delivery_method: deliveryMethod,
        whatsapp_url: deliveryUrl,
        email: paymentRecord.email,
        drive_link: paymentRecord.google_drive_link,
        whatsapp_group: "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X",
        phone: cleanPhone,
        make_automation: makeResult.success ? 'triggered' : 'failed'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log('No phone number available for delivery');
      
      // Mark as completed even without phone
      await supabase
        .from('payments')
        .update({ 
          whatsapp_sent: false,
          delivery_method: 'no_phone'
        })
        .eq('id', paymentRecord.id);

      return new Response(JSON.stringify({ 
        message: 'Payment processed successfully (no phone delivery)',
        payment_id: payment.id,
        email: paymentRecord.email,
        drive_link: paymentRecord.google_drive_link
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in razorpay-webhook function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
