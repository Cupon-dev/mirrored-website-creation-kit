
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
    console.log('[RAZORPAY-WEBHOOK] === STRICT WEBHOOK PROCESSING ===')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // STRICT: Verify webhook signature
    const webhookSecret = "Check@123#"
    const signature = req.headers.get('x-razorpay-signature')
    const body = await req.text()
    
    if (!signature || !webhookSecret) {
      console.log('[RAZORPAY-WEBHOOK] Missing signature or secret')
      return new Response('Signature verification failed', { status: 400, headers: corsHeaders })
    }

    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')
    
    if (signature !== expectedSignature) {
      console.log('[RAZORPAY-WEBHOOK] Invalid signature - webhook rejected')
      return new Response('Invalid signature', { status: 400, headers: corsHeaders })
    }

    const payload = JSON.parse(body)
    console.log('[RAZORPAY-WEBHOOK] Verified webhook payload:', JSON.stringify(payload, null, 2))

    // STRICT: Only process captured payments
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

    console.log('[RAZORPAY-WEBHOOK] Processing payment with strict validation:', {
      paymentId,
      orderId,
      status,
      amount,
      captured,
      email,
      phone
    })

    // STRICT: Validate all required fields
    if (!email || !paymentId || !orderId || !captured || status !== 'captured') {
      console.log('[RAZORPAY-WEBHOOK] Payment validation failed - missing required fields')
      return new Response('Payment validation failed', { status: 400, headers: corsHeaders })
    }

    // Find and update payment record with strict matching
    let { data: existingPayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .eq('email', email)
      .single()

    if (paymentError || !existingPayment) {
      console.log('[RAZORPAY-WEBHOOK] No matching payment found by order ID and email')
      return new Response('Payment record not found', { status: 404, headers: corsHeaders })
    }

    // STRICT: Update payment with verification timestamp
    console.log('[RAZORPAY-WEBHOOK] Updating payment record with verification:', existingPayment.id)

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
      return new Response('Payment update failed', { status: 500, headers: corsHeaders })
    }

    // STRICT: Grant access only for verified user and exact product match
    console.log('[RAZORPAY-WEBHOOK] Granting product access with strict validation')

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      console.log('[RAZORPAY-WEBHOOK] User not found - access will be granted when user logs in')
    } else {
      console.log('[RAZORPAY-WEBHOOK] Found user for access grant:', userData.id)

      // Get products that exactly match payment amount
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, name')
        .eq('is_active', true)

      if (productsError || !productsData || productsData.length === 0) {
        console.log('[RAZORPAY-WEBHOOK] No active products found')
      } else {
        // STRICT: Only grant access to products that exactly match payment amount
        const exactMatchProducts = productsData.filter(product => {
          const productPrice = Number(product.price || 0)
          const exactMatch = Math.abs(productPrice - amount) < 0.01
          console.log('[RAZORPAY-WEBHOOK] Product price match check:', {
            productId: product.id,
            productPrice,
            paymentAmount: amount,
            exactMatch
          })
          return exactMatch
        })

        if (exactMatchProducts.length === 0) {
          console.log('[RAZORPAY-WEBHOOK] No products match payment amount exactly')
        } else {
          for (const product of exactMatchProducts) {
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

            // Grant access with payment reference
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
              console.log('[RAZORPAY-WEBHOOK] Access granted for product:', product.id, 'amount:', product.price)
            }
          }
        }
      }
    }

    console.log('[RAZORPAY-WEBHOOK] === STRICT WEBHOOK PROCESSING COMPLETED ===')
    return new Response('Success', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('[RAZORPAY-WEBHOOK] CRITICAL ERROR:', error)
    return new Response('Server error', { status: 500, headers: corsHeaders })
  }
})
