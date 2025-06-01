
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

// Function to send WhatsApp message using Twilio WhatsApp API
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const twilioToken = '8ff9d826cc26d4f5427030cf828e5d8a';
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    
    if (!twilioAccountSid) {
      console.error('TWILIO_ACCOUNT_SID not found in environment variables');
      return { success: false, error: 'Twilio Account SID missing' };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
    
    console.log('Attempting to send WhatsApp message to:', formattedPhone);
    console.log('Using Twilio Account SID:', twilioAccountSid.substring(0, 10) + '...');

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const body = new URLSearchParams({
      From: 'whatsapp:+12344373192',
      To: `whatsapp:${formattedPhone}`,
      Body: message
    });

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('WhatsApp message sent successfully via Twilio:', result.sid);
      return { success: true, sid: result.sid, method: 'twilio' };
    } else {
      console.error('Twilio WhatsApp API failed:', result);
      return { success: false, error: result.message, method: 'twilio' };
    }
  } catch (error) {
    console.error('Error with Twilio WhatsApp API:', error);
    return { success: false, error: error.message, method: 'twilio' };
  }
}

// Fallback function to create WhatsApp web link
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
    return { success: false, error: error.message, method: 'web_link' };
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

    // Always try to send WhatsApp message (even if already sent before)
    const cleanPhone = (paymentRecord.mobile_number || paymentPhone || '').replace(/\D/g, '');
    
    if (cleanPhone) {
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

      // Try Twilio first, fallback to web link
      const twilioResult = await sendWhatsAppMessage(cleanPhone, message);
      let deliveryMethod = 'failed';
      let deliveryUrl = null;

      if (twilioResult.success) {
        deliveryMethod = 'twilio';
        console.log('WhatsApp message sent successfully via Twilio');
      } else {
        console.log('Twilio failed, creating WhatsApp web link as fallback');
        const webLinkResult = createWhatsAppWebLink(cleanPhone, message);
        if (webLinkResult.success) {
          deliveryMethod = 'web_link';
          deliveryUrl = webLinkResult.url;
          console.log('WhatsApp web link created successfully');
        }
      }

      // Update payment record with delivery status
      await supabase
        .from('payments')
        .update({ 
          whatsapp_sent: true,
          delivery_method: deliveryMethod,
          whatsapp_url: deliveryUrl
        })
        .eq('id', paymentRecord.id);

      console.log('Payment processed successfully. Delivery method:', deliveryMethod);

      return new Response(JSON.stringify({ 
        message: 'Payment processed and delivered successfully',
        payment_id: payment.id,
        delivery_method: deliveryMethod,
        whatsapp_url: deliveryUrl,
        email: paymentRecord.email,
        drive_link: paymentRecord.google_drive_link,
        whatsapp_group: whatsappGroupLink
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log('No phone number available for WhatsApp delivery');
      
      // Mark as completed even without WhatsApp
      await supabase
        .from('payments')
        .update({ 
          whatsapp_sent: false,
          delivery_method: 'no_phone'
        })
        .eq('id', paymentRecord.id);

      return new Response(JSON.stringify({ 
        message: 'Payment processed successfully (no WhatsApp delivery - missing phone)',
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
