
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash, createHmac } from "https://deno.land/std@0.119.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[RAZORPAY-WEBHOOK] === WEBHOOK REQUEST RECEIVED ===')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook secret
    const webhookSecret = "Check@123#" // Using the provided secret
    
    // Verify webhook signature
    const signature = req.headers.get('x-razorpay-signature')
    const body = await req.text()
    
    if (signature && webhookSecret) {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        console.log('[RAZORPAY-WEBHOOK] Invalid signature')
        return new Response('Invalid signature', { status: 400, headers: corsHeaders })
      }
    }

    const payload = JSON.parse(body)
    console.log('[RAZORPAY-WEBHOOK] Webhook payload received:', JSON.stringify(payload, null, 2))

    if (payload.event !== 'payment.captured') {
      console.log('[RAZORPAY-WEBHOOK] Event not payment.captured, ignoring')
      return new Response('Event not handled', { status: 200, headers: corsHeaders })
    }

    const paymentEntity = payload.payload.payment.entity
    const paymentId = paymentEntity.id
    const orderId = paymentEntity.order_id
    const status = paymentEntity.status
    const amount = paymentEntity.amount / 100
    const captured = paymentEntity.captured
    const email = paymentEntity.email || paymentEntity.notes?.email
    const phone = paymentEntity.contact || paymentEntity.notes?.phone

    console.log('[RAZORPAY-WEBHOOK] Processing payment:', {
      paymentId,
      orderId,
      status,
      amount,
      captured,
      email,
      phone
    })

    if (!email) {
      console.log('[RAZORPAY-WEBHOOK] No email found in payment data')
      return new Response('No email found', { status: 400, headers: corsHeaders })
    }

    if (status !== 'captured' || !captured) {
      console.log('[RAZORPAY-WEBHOOK] Payment not captured, skipping')
      return new Response('Payment not captured', { status: 200, headers: corsHeaders })
    }

    // Find payment record by order ID
    let { data: existingPayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single()

    if (paymentError || !existingPayment) {
      console.log('[RAZORPAY-WEBHOOK] No payment found by order ID, searching by email')
      
      const { data: pendingPayments, error: pendingError } = await supabase
        .from('payments')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      if (pendingError || !pendingPayments || pendingPayments.length === 0) {
        console.log('[RAZORPAY-WEBHOOK] No pending payment found, creating new record')
        
        const { data: newPayment, error: createError } = await supabase
          .from('payments')
          .insert({
            email: email,
            mobile_number: phone,
            amount: amount,
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            status: 'completed',
            verified_at: new Date().toISOString(),
            google_drive_link: "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link"
          })
          .select()
          .single()

        if (createError) {
          console.error('[RAZORPAY-WEBHOOK] Error creating payment record:', createError)
          return new Response('Database error', { status: 500, headers: corsHeaders })
        }

        existingPayment = newPayment
      } else {
        existingPayment = pendingPayments[0]
      }
    }

    // Update payment record
    console.log('[RAZORPAY-WEBHOOK] Updating payment record:', existingPayment.id)

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id: paymentId,
        status: 'completed',
        verified_at: new Date().toISOString(),
        razorpay_order_id: orderId
      })
      .eq('id', existingPayment.id)

    if (updateError) {
      console.error('[RAZORPAY-WEBHOOK] Error updating payment:', updateError)
      return new Response('Update failed', { status: 500, headers: corsHeaders })
    }

    // Grant product access
    console.log('[RAZORPAY-WEBHOOK] Granting product access for email:', email)

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      console.log('[RAZORPAY-WEBHOOK] No user found, access will be granted when user logs in')
    } else {
      console.log('[RAZORPAY-WEBHOOK] Found user:', userData.id)

      // Get all active products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, name')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (productsError || !productsData || productsData.length === 0) {
        console.log('[RAZORPAY-WEBHOOK] No active products found')
      } else {
        // Find matching products by amount
        const matchingProducts = productsData.filter(product => {
          const productPrice = Number(product.price || 0)
          return Math.abs(productPrice - amount) < 0.01
        })

        const productsToGrant = matchingProducts.length > 0 ? matchingProducts : [productsData[0]]

        for (const product of productsToGrant) {
          // Check if access already exists
          const { data: existingAccess } = await supabase
            .from('user_product_access')
            .select('id')
            .eq('user_id', userData.id)
            .eq('product_id', product.id)
            .maybeSingle()

          if (existingAccess) {
            console.log('[RAZORPAY-WEBHOOK] Access already exists for product:', product.id)
            continue
          }

          // Grant access
          const { error: accessError } = await supabase
            .from('user_product_access')
            .insert({
              user_id: userData.id,
              product_id: product.id,
              payment_id: existingPayment.id
            })

          if (accessError) {
            console.error('[RAZORPAY-WEBHOOK] Error granting access:', accessError)
          } else {
            console.log('[RAZORPAY-WEBHOOK] Access granted for product:', product.id)
          }
        }
      }
    }

    console.log('[RAZORPAY-WEBHOOK] === WEBHOOK PROCESSING COMPLETED ===')
    return new Response('Success', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('[RAZORPAY-WEBHOOK] ERROR:', error)
    return new Response('Server error', { status: 500, headers: corsHeaders })
  }
})
