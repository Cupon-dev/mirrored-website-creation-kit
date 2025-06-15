
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[CREATE-RAZORPAY-ORDER] Starting order creation...')
    
    const { amount, currency, receipt, notes } = await req.json()
    
    console.log('[CREATE-RAZORPAY-ORDER] Order details:', {
      amount,
      currency,
      receipt,
      notes
    })

    // Use Razorpay test credentials for now - user should add their real ones
    const razorpayKeyId = 'rzp_test_your_key_id' // User should replace with their actual key
    const razorpayKeySecret = 'your_secret_key' // User should replace with their actual secret
    
    const orderData = {
      amount: amount,
      currency: currency || 'INR',
      receipt: receipt,
      notes: notes || {}
    }

    console.log('[CREATE-RAZORPAY-ORDER] Creating order with Razorpay...')

    // Create order with Razorpay
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CREATE-RAZORPAY-ORDER] Razorpay API error:', errorText)
      throw new Error(`Razorpay API error: ${response.status}`)
    }

    const order = await response.json()
    console.log('[CREATE-RAZORPAY-ORDER] Order created successfully:', order.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: order 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[CREATE-RAZORPAY-ORDER] Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
