import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { payment_id, user_email, product_id } = await req.json()
    
    console.log('Payment verification request:', { payment_id, user_email, product_id })
    
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. VERIFY PAYMENT WITH RAZORPAY API
    if (payment_id) {
      console.log('Verifying payment with Razorpay:', payment_id)
      
      const razorpayResponse = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}`, {
        headers: {
          'Authorization': `Basic ${btoa(Deno.env.get('RAZORPAY_KEY_ID') + ':' + Deno.env.get('RAZORPAY_KEY_SECRET'))}`
        }
      })
      
      if (!razorpayResponse.ok) {
        throw new Error('Failed to verify payment with Razorpay')
      }
      
      const paymentData = await razorpayResponse.json()
      console.log('Razorpay payment data:', paymentData)
      
      // 2. VERIFY PAYMENT IS ACTUALLY CAPTURED/PAID
      if (paymentData.status !== 'captured') {
        throw new Error(`Payment not completed. Status: ${paymentData.status}`)
      }
    }

    // 3. FIND USER BY EMAIL
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', user_email)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      throw new Error('User not found')
    }

    // 4. CHECK IF USER ALREADY HAS ACCESS
    const { data: existingAccess } = await supabase
      .from('user_product_access')
      .select('*')
      .eq('user_id', userData.id)
      .eq('product_id', product_id)
      .single()

    if (existingAccess) {
      console.log('User already has access')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User already has access',
          accessGranted: true 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // 5. CREATE PAYMENT RECORD
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userData.id,
        product_id: product_id,
        amount: 0, // You should get this from Razorpay data
        currency: 'INR',
        status: 'completed',
        razorpay_payment_id: payment_id,
        verified_at: new Date().toISOString(),
        payment_method: 'razorpay'
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError)
      throw new Error('Failed to create payment record')
    }

    // 6. GRANT ACCESS TO USER
    const { error: accessError } = await supabase
      .from('user_product_access')
      .insert({
        user_id: userData.id,
        product_id: product_id,
        payment_id: paymentRecord.id,
        granted_at: new Date().toISOString()
      })

    if (accessError) {
      console.error('Failed to grant access:', accessError)
      throw new Error('Failed to grant access')
    }

    // 7. GET PRODUCT DETAILS FOR RESPONSE
    const { data: productData } = await supabase
      .from('products')
      .select('name, access_link')
      .eq('id', product_id)
      .single()

    console.log('Access granted successfully')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        accessGranted: true,
        message: 'Payment verified and access granted',
        driveLink: productData?.access_link,
        productName: productData?.name
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Payment verification error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        accessGranted: false
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
