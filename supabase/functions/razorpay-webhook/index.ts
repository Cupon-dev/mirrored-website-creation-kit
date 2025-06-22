import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    console.log('🔔 Razorpay webhook received')
    
    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    
    console.log('📝 Webhook signature:', signature ? 'Present' : 'Missing')
    
    // Verify webhook signature for security
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (webhookSecret && signature) {
      console.log('🔐 Verifying webhook signature...')
      
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
      const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      if (expectedSignatureHex !== signature) {
        console.error('❌ Invalid webhook signature')
        return new Response('Invalid signature', { status: 401, headers: corsHeaders })
      }
      
      console.log('✅ Webhook signature verified')
    } else if (webhookSecret) {
      console.error('❌ Missing webhook signature')
      return new Response('Missing signature', { status: 401, headers: corsHeaders })
    } else {
      console.log('⚠️ Webhook secret not configured, skipping signature verification')
    }
    
    // Parse the webhook payload
    let webhookData
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error('❌ Invalid JSON payload:', error)
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
    }

    console.log('📦 Webhook event:', webhookData.event)
    console.log('💳 Payment data:', webhookData.payload?.payment?.entity || 'No payment data')

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Log webhook event for audit trail
    await logWebhookEvent(supabase, webhookData, signature)

    // Handle different webhook events
    const eventType = webhookData.event
    const payment = webhookData.payload?.payment?.entity

    if (!payment) {
      console.error('❌ No payment data in webhook')
      return new Response('No payment data', { status: 400, headers: corsHeaders })
    }

    let result
    switch (eventType) {
      case 'payment.captured':
        result = await handlePaymentCaptured(supabase, payment)
        break
      
      case 'payment.failed':
        result = await handlePaymentFailed(supabase, payment)
        break
        
      case 'payment.authorized':
        result = await handlePaymentAuthorized(supabase, payment)
        break
        
      default:
        console.log('ℹ️ Ignoring unhandled event:', eventType)
        return new Response('Event ignored', { status: 200, headers: corsHeaders })
    }

    console.log('🎉 Webhook processing completed successfully')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: result.message,
        payment_id: payment.id,
        event: eventType
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    
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

async function handlePaymentCaptured(supabase: any, payment: any) {
  const razorpayPaymentId = payment.id
  const amount = payment.amount / 100 // Razorpay amount is in paise
  const currency = payment.currency
  const status = payment.status
  const email = payment.email
  const contact = payment.contact

  console.log('💰 Payment captured details:', {
    id: razorpayPaymentId,
    amount,
    currency,
    status,
    email,
    contact
  })

  // Check if this payment already exists
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('razorpay_payment_id', razorpayPaymentId)
    .single()

  if (existingPayment) {
    if (existingPayment.status === 'completed') {
      console.log('✅ Payment already processed:', razorpayPaymentId)
      return { message: 'Payment already processed' }
    }
    
    // Update existing payment
    console.log('🔄 Updating existing payment:', razorpayPaymentId)
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        verified_at: new Date().toISOString(),
        notes: 'Verified via Razorpay webhook'
      })
      .eq('razorpay_payment_id', razorpayPaymentId)

    if (updateError) {
      console.error('❌ Error updating payment:', updateError)
      throw updateError
    }

    console.log('✅ Payment updated successfully')
    return { message: 'Payment updated successfully' }
  } else {
    // Create new payment record
    console.log('➕ Creating new payment record for:', razorpayPaymentId)
    
    // Try to find user by email if provided
    let userId = null
    if (email) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      
      if (userData) {
        userId = userData.id
        console.log('👤 Found user:', email)
      } else {
        // Create new user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: email,
            name: email.split('@')[0],
            mobile_number: contact,
            is_verified: true
          })
          .select('id')
          .single()

        if (userError) {
          console.error('❌ Error creating user:', userError)
          // Continue without user if creation fails
        } else {
          userId = newUser.id
          console.log('👤 Created new user:', email)
        }
      }
    }

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        email: email,
        amount: amount,
        status: 'completed',
        payment_method: 'razorpay',
        razorpay_payment_id: razorpayPaymentId,
        verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        notes: 'Auto-verified via Razorpay webhook'
      })
      .select('id')
      .single()

    if (paymentError) {
      console.error('❌ Error creating payment:', paymentError)
      throw paymentError
    }

    console.log('✅ Payment record created:', paymentRecord.id)

    // Grant access if we have a user
    if (userId) {
      await grantUserAccess(supabase, userId, paymentRecord.id, payment.notes)
    }

    // Handle any pending payments for this user
    if (email) {
      await handlePendingPayments(supabase, email, razorpayPaymentId)
    }

    return { message: 'Payment processed successfully' }
  }
}

async function handlePaymentFailed(supabase: any, payment: any) {
  const razorpayPaymentId = payment.id
  const amount = payment.amount / 100
  const email = payment.email
  const contact = payment.contact

  console.log('❌ Payment failed:', {
    id: razorpayPaymentId,
    amount,
    email,
    error_code: payment.error_code,
    error_description: payment.error_description
  })

  // Check if payment record exists
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('razorpay_payment_id', razorpayPaymentId)
    .single()

  if (existingPayment) {
    // Update existing payment to failed
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        notes: `Payment failed: ${payment.error_description || payment.error_code || 'Unknown error'}`
      })
      .eq('razorpay_payment_id', razorpayPaymentId)

    if (updateError) {
      console.error('❌ Error updating failed payment:', updateError)
      throw updateError
    }
  } else {
    // Create new failed payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        email: email,
        amount: amount,
        status: 'failed',
        payment_method: 'razorpay',
        razorpay_payment_id: razorpayPaymentId,
        created_at: new Date().toISOString(),
        notes: `Payment failed: ${payment.error_description || payment.error_code || 'Unknown error'}`
      })

    if (paymentError) {
      console.error('❌ Error creating failed payment record:', paymentError)
      throw paymentError
    }
  }

  console.log('✅ Failed payment recorded')
  return { message: 'Failed payment recorded' }
}

async function handlePaymentAuthorized(supabase: any, payment: any) {
  const razorpayPaymentId = payment.id
  const amount = payment.amount / 100
  const email = payment.email

  console.log('🔒 Payment authorized (pending capture):', {
    id: razorpayPaymentId,
    amount,
    email
  })

  // Record as pending capture
  const { error: paymentError } = await supabase
    .from('payments')
    .upsert({
      email: email,
      amount: amount,
      status: 'authorized',
      payment_method: 'razorpay',
      razorpay_payment_id: razorpayPaymentId,
      created_at: new Date().toISOString(),
      notes: 'Payment authorized, awaiting capture'
    }, {
      onConflict: 'razorpay_payment_id'
    })

  if (paymentError) {
    console.error('❌ Error recording authorized payment:', paymentError)
    throw paymentError
  }

  console.log('✅ Authorized payment recorded')
  return { message: 'Authorized payment recorded' }
}

async function grantUserAccess(supabase: any, userId: string, paymentId: string, paymentNotes: any = {}) {
  try {
    // Determine product access based on payment notes or amount
    const productId = paymentNotes?.product_id || 'webhook-verified-access'
    
    const { error: accessError } = await supabase
      .from('user_product_access')
      .insert({
        user_id: userId,
        product_id: productId,
        payment_id: paymentId,
        granted_at: new Date().toISOString()
      })

    if (accessError && !accessError.message.includes('duplicate')) {
      console.error('⚠️ Error granting access:', accessError)
    } else {
      console.log('🎯 Access granted to user:', userId)
    }
  } catch (error) {
    console.error('❌ Error in grantUserAccess:', error)
  }
}

async function handlePendingPayments(supabase: any, email: string, razorpayPaymentId: string) {
  try {
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('id, user_id')
      .eq('email', email)
      .eq('status', 'pending_verification')

    if (pendingPayments && pendingPayments.length > 0) {
      console.log(`🔄 Found ${pendingPayments.length} pending payments for ${email}`)
      
      for (const pendingPayment of pendingPayments) {
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            razorpay_payment_id: razorpayPaymentId,
            verified_at: new Date().toISOString(),
            notes: 'Linked to Razorpay webhook payment'
          })
          .eq('id', pendingPayment.id)

        // Grant access for pending payment
        if (pendingPayment.user_id) {
          await grantUserAccess(supabase, pendingPayment.user_id, pendingPayment.id)
        }
      }
      
      console.log('✅ Updated pending payments')
    }
  } catch (error) {
    console.error('❌ Error handling pending payments:', error)
  }
}

async function logWebhookEvent(supabase: any, webhookData: any, signature: string | null) {
  try {
    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: webhookData.event,
        payment_id: webhookData.payload?.payment?.entity?.id,
        payload: webhookData,
        signature: signature,
        processed_at: new Date().toISOString()
      })

    if (error) {
      console.error('⚠️ Error logging webhook event:', error)
      // Don't throw here as logging is not critical
    } else {
      console.log('📝 Webhook event logged')
    }
  } catch (error) {
    console.error('❌ Error in logWebhookEvent:', error)
    // Don't throw here as logging is not critical
  }
}
