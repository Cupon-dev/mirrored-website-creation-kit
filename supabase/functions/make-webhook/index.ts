
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MakeWebhookPayload {
  email: string;
  phone: string;
  amount: number;
  payment_id: string;
  drive_link: string;
  customer_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: MakeWebhookPayload = await req.json();
    console.log('Triggering Make.com automation with payload:', payload);

    // Get Make.com webhook URL from environment
    const makeWebhookUrl = Deno.env.get('MAKE_WEBHOOK_URL');
    
    if (!makeWebhookUrl) {
      console.error('MAKE_WEBHOOK_URL not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Make.com webhook not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare data for Make.com
    const makePayload = {
      email: payload.email,
      phone: payload.phone,
      amount: payload.amount,
      payment_id: payload.payment_id,
      drive_link: payload.drive_link,
      customer_name: payload.customer_name || payload.email.split('@')[0],
      whatsapp_group: "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X",
      timestamp: new Date().toISOString(),
      message_template: `🎉 *Payment Received - Order Confirmed!* 🎉

Thank you for your purchase!

*Payment Details:*
*Amount:* ₹${payload.amount}
*Payment ID:* ${payload.payment_id}

📥 *Your Download Link:*
${payload.drive_link}

👥 *Join our WhatsApp Community:*
https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X

*Instructions:*
1. Click the download link above to access your content
2. Make sure you're logged into Google with: ${payload.email}
3. Join our community for updates and support

Need help? Reply to this message!

Thank you for choosing us! 🚀`
    };

    // Send to Make.com webhook
    const makeResponse = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(makePayload),
    });

    if (!makeResponse.ok) {
      throw new Error(`Make.com webhook failed: ${makeResponse.status}`);
    }

    console.log('Make.com automation triggered successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Make.com automation triggered successfully',
      delivery_method: 'make_automation'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error triggering Make.com automation:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
