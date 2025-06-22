import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      user_email, 
      product_id, 
      payment_method, 
      payment_reference, 
      transaction_id,
      upi_ref_id,
      amount,
      payment_proof_url 
    } = await req.json()
    
    console.log('🔒 SECURE: Payment verification request:', { 
      user_email, 
      product_id, 
      payment_method,
      payment_reference,
      transaction_id,
      upi_ref_id,
      amount 
    })
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. FIND USER BY EMAIL
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', user_email)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      throw new Error('User not found')
    }

    // 2. CHECK IF USER ALREADY HAS ACCESS
    const { data: existingAccess } = await supabase
      .from('user_product_access')
      .select('*')
      .eq('user_id', userData.id)
      .eq('product_id', product_id)
      .single()

    if (existingAccess) {
      console.log('✅ User already has access')
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

    // 3. CREATE PAYMENT RECORD (Pending verification)
    const paymentStatus = payment_method === 'admin_verified' ? 'completed' : 'pending_verification'
    
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userData.id,
        product_id: product_id,
        amount: amount || 0,
        currency: 'INR',
        status: paymentStatus,
        payment_method: payment_method,
        razorpay_payment_id: payment_reference,
        transaction_id: transaction_id,
        upi_reference_id: upi_ref_id,
        payment_proof_url: payment_proof_url,
        verified_at: payment_method === 'admin_verified' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError)
      throw new Error('Failed to create payment record')
    }

    // 4. GRANT ACCESS IF VERIFIED
    let accessGranted = false
    
    if (paymentStatus === 'completed') {
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
      
      accessGranted = true
    }

    // 5. GET PRODUCT DETAILS
    const { data: productData } = await supabase
      .from('products')
      .select('name, access_link')
      .eq('id', product_id)
      .single()

    const responseMessage = accessGranted 
      ? 'Payment verified and access granted immediately!'
      : 'Payment received! Access will be granted after verification (usually within 30 minutes).'

    console.log(accessGranted ? '✅ Access granted immediately' : '⏳ Payment pending verification')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        accessGranted: accessGranted,
        message: responseMessage,
        driveLink: accessGranted ? productData?.access_link : null,
        productName: productData?.name,
        paymentId: paymentRecord.id
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('❌ Payment verification error:', error)
    
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
