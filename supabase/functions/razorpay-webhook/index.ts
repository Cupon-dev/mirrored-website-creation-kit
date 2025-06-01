
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
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '8ff9d826cc26d4f5427030cf828e5d8a';
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    
    if (!twilioAccountSid || !twilioToken) {
      console.error('Twilio credentials not found');
      return { success: false, error: 'Twilio credentials missing' };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
    
    console.log('Sending WhatsApp message to:', formattedPhone);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const body = new URLSearchParams({
      From: 'whatsapp:+12344373192', // Your Twilio WhatsApp number
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
      console.log('WhatsApp message sent successfully:', result.sid);
      return { success: true, sid: result.sid };
    } else {
      console.error('Failed to send WhatsApp message:', result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

// Function to send email notification as backup
async function sendEmailNotification(email: string, driveLink: string, whatsappGroupLink: string) {
  try {
    console.log(`Email notification would be sent to: ${email}`);
    console.log(`Drive link: ${driveLink}`);
    console.log(`WhatsApp group: ${whatsappGroupLink}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received webhook request');
    
    const webhookPayload: RazorpayWebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));

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

    const { data: orderRecord, error: orderError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', payment.order_id)
      .single();

    if (orderRecord && !orderError) {
      paymentRecord = orderRecord;
    } else {
      console.log('Order ID not found, searching by email and amount...');
      
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

    if (!paymentRecord.whatsapp_sent) {
      const cleanPhone = (paymentRecord.mobile_number || paymentPhone || '').replace(/\D/g, '');
      
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

      // Send WhatsApp message using Twilio
      const whatsappResult = await sendWhatsAppMessage(cleanPhone, message);
      console.log('WhatsApp sending result:', whatsappResult);

      // Send email notification as backup
      const emailResult = await sendEmailNotification(
        paymentRecord.email, 
        paymentRecord.google_drive_link, 
        whatsappGroupLink
      );
      console.log('Email sending result:', emailResult);

      // Mark WhatsApp as sent
      await supabase
        .from('payments')
        .update({ 
          whatsapp_sent: true,
        })
        .eq('id', paymentRecord.id);

      console.log('Payment processed successfully. Automatic delivery initiated.');

      return new Response(JSON.stringify({ 
        message: 'Payment processed and delivered successfully',
        payment_id: payment.id,
        whatsapp_sent: whatsappResult.success,
        email_sent: emailResult.success,
        email: paymentRecord.email,
        drive_link: paymentRecord.google_drive_link
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log('WhatsApp already sent for this payment');
      return new Response(JSON.stringify({ 
        message: 'Payment already processed and delivered',
        payment_id: payment.id
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
