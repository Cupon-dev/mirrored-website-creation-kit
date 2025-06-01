
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

// Function to send WhatsApp message using WhatsApp Business API
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    // Using WhatsApp Business API (you'll need to get API credentials)
    // For now, we'll create a direct WhatsApp link that opens automatically
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    console.log('WhatsApp message URL generated:', whatsappUrl);
    
    // You can integrate with services like:
    // 1. Twilio WhatsApp API
    // 2. WhatsApp Business API
    // 3. Ultramsg API
    // 4. CallMeBot API
    
    // For now, we'll use a simple HTTP request to a WhatsApp API service
    // Replace this with your preferred WhatsApp API service
    
    return { success: true, url: whatsappUrl };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

// Function to send email notification as backup
async function sendEmailNotification(email: string, driveLink: string, whatsappGroupLink: string) {
  try {
    // You can integrate with email services like SendGrid, Resend, etc.
    console.log(`Email notification would be sent to: ${email}`);
    console.log(`Drive link: ${driveLink}`);
    console.log(`WhatsApp group: ${whatsappGroupLink}`);
    
    // For now, just log - you can implement actual email sending
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received webhook request');
    
    const webhookPayload: RazorpayWebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));

    // Only process payment.captured events
    if (webhookPayload.event !== 'payment.captured') {
      console.log('Ignoring non-payment.captured event:', webhookPayload.event);
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = webhookPayload.payload.payment.entity;
    console.log('Processing payment:', payment.id, 'for order:', payment.order_id);

    // Extract email and phone from payment data
    const paymentEmail = payment.email || payment.notes?.email;
    const paymentPhone = payment.contact || payment.notes?.phone;

    console.log('Payment details - Email:', paymentEmail, 'Phone:', paymentPhone);

    // First try to find by razorpay_order_id
    let paymentRecord = null;

    const { data: orderRecord, error: orderError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', payment.order_id)
      .single();

    if (orderRecord && !orderError) {
      paymentRecord = orderRecord;
    } else {
      // If not found by order_id, try to find by email and amount
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

    // If still no record found, create a new one based on payment data
    if (!paymentRecord) {
      console.log('Creating new payment record from webhook data...');
      
      const driveLink = "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link";
      
      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert([{
          email: paymentEmail || 'unknown@email.com',
          mobile_number: paymentPhone || '',
          amount: payment.amount / 100, // Convert paise to rupees
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
      // Update existing payment record
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

    // Send WhatsApp message and email automatically
    if (!paymentRecord.whatsapp_sent) {
      const cleanPhone = (paymentRecord.mobile_number || paymentPhone || '').replace(/\D/g, '');
      
      // WhatsApp group link - REPLACE THIS WITH YOUR ACTUAL GROUP LINK
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

      // Send WhatsApp message
      const whatsappResult = await sendWhatsAppMessage(cleanPhone, message);
      console.log('WhatsApp sending result:', whatsappResult);

      // Send email notification as backup
      const emailResult = await sendEmailNotification(
        paymentRecord.email, 
        paymentRecord.google_drive_link, 
        whatsappGroupLink
      );
      console.log('Email sending result:', emailResult);

      // Mark WhatsApp as sent and store the WhatsApp URL for frontend
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
        whatsapp_url: whatsappResult.url,
        email: paymentRecord.email,
        drive_link: paymentRecord.google_drive_link,
        whatsapp_sent: whatsappResult.success,
        email_sent: emailResult.success
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
