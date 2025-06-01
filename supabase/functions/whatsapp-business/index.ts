
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppBusinessRequest {
  phone: string;
  message: string;
  businessNumber?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, businessNumber }: WhatsAppBusinessRequest = await req.json();

    console.log('WhatsApp Business message request:', { phone, businessNumber });

    // Clean and format phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // Create WhatsApp Business web link
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    // If you have WhatsApp Business API credentials, you can implement direct sending here
    // For now, we'll return the web link for manual sending

    console.log('Generated WhatsApp link:', whatsappUrl);

    return new Response(JSON.stringify({
      success: true,
      whatsapp_url: whatsappUrl,
      phone: formattedPhone,
      method: 'web_link',
      message: 'WhatsApp link generated successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in whatsapp-business function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
