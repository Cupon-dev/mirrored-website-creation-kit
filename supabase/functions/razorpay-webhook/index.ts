
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
      };
    };
  };
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
    console.log('Processing payment:', payment.id);

    // Find the payment record in our database using the razorpay_order_id
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', payment.order_id)
      .single();

    if (fetchError) {
      console.error('Error fetching payment record:', fetchError);
      return new Response(JSON.stringify({ error: 'Payment record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found payment record:', paymentRecord.id);

    // Update payment status to completed
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        razorpay_payment_id: payment.id,
        verified_at: new Date().toISOString(),
        whatsapp_sent: true
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Error updating payment record:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send WhatsApp message with download link
    const cleanPhone = paymentRecord.mobile_number.replace(/\D/g, '');
    
    // WhatsApp group link (replace with your actual group link)
    const whatsappGroupLink = "https://chat.whatsapp.com/YOUR_GROUP_LINK";

    const message = `🎉 *Payment Received - Order Confirmed!* 🎉

Thank you for your purchase!

*Total: $${paymentRecord.amount}*

📥 *Your Download Link:*
${paymentRecord.google_drive_link}

👥 *Join our WhatsApp Community:*
${whatsappGroupLink}

*Instructions:*
1. Click the download link above
2. Save to your Google Drive for lifetime access
3. Join our community for updates and support

Need help? Reply to this message!

Thank you for choosing us! 🚀`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    console.log('WhatsApp URL generated for:', cleanPhone);
    console.log('WhatsApp URL:', whatsappUrl);

    // Log successful processing
    console.log('Payment processed successfully:', payment.id);

    return new Response(JSON.stringify({ 
      message: 'Payment processed successfully',
      payment_id: payment.id,
      whatsapp_url: whatsappUrl
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
