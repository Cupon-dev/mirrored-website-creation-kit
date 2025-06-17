
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
    console.log('[RAZORPAY-WEBHOOK] === PRODUCTION WEBHOOK PROCESSING ===')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify webhook signature
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

    // Process captured payments
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

    // Validate required fields
    if (!email || !paymentId || !orderId || !captured || status !== 'captured') {
      console.log('[RAZORPAY-WEBHOOK] Payment validation failed - missing required fields')
      return new Response('Payment validation failed', { status: 400, headers: corsHeaders })
    }

    // Find and update payment record
    const { data: existingPayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .eq('email', email)
      .single()

    if (paymentError || !existingPayment) {
      console.log('[RAZORPAY-WEBHOOK] No matching payment found, creating new record')
      
      // Create new payment record
      const { data: newPayment, error: insertError } = await supabase
        .from('payments')
        .insert({
          email: email,
          mobile_number: phone || '',
          amount: amount,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          status: 'completed',
          verified_at: new Date().toISOString(),
          google_drive_link: "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link"
        })
        .select()
        .single()

      if (insertError) {
        console.error('[RAZORPAY-WEBHOOK] Error creating payment record:', insertError)
        return new Response('Payment creation failed', { status: 500, headers: corsHeaders })
      }

      console.log('[RAZORPAY-WEBHOOK] Created new payment record:', newPayment.id)
    } else {
      // Update existing payment record
      console.log('[RAZORPAY-WEBHOOK] Updating existing payment record:', existingPayment.id)

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
    }

    // Grant product access
    console.log('[RAZORPAY-WEBHOOK] Granting product access')

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      console.log('[RAZORPAY-WEBHOOK] User not found - access will be granted when user logs in')
    } else {
      console.log('[RAZORPAY-WEBHOOK] Found user for access grant:', userData.id)

      // Get products that match payment amount
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, name')
        .eq('is_active', true)

      if (productsError || !productsData || productsData.length === 0) {
        console.log('[RAZORPAY-WEBHOOK] No active products found')
      } else {
        // Find matching products (with some flexibility)
        const matchingProducts = productsData.filter(product => {
          const productPrice = Number(product.price || 0)
          const exactMatch = Math.abs(productPrice - amount) < 1
          console.log('[RAZORPAY-WEBHOOK] Product price match check:', {
            productId: product.id,
            productPrice,
            paymentAmount: amount,
            exactMatch
          })
          return exactMatch
        })

        if (matchingProducts.length === 0) {
          // If no exact match, find closest product
          const closestProduct = productsData.reduce((closest, product) => {
            const productPrice = Number(product.price || 0)
            const currentDiff = Math.abs(productPrice - amount)
            const closestDiff = Math.abs(Number(closest.price || 0) - amount)
            return currentDiff < closestDiff ? product : closest
          })

          if (Math.abs(Number(closestProduct.price || 0) - amount) <= amount * 0.1) {
            matchingProducts.push(closestProduct)
            console.log('[RAZORPAY-WEBHOOK] Using closest matching product:', closestProduct.id)
          }
        }

        if (matchingProducts.length === 0) {
          console.log('[RAZORPAY-WEBHOOK] No products match payment amount')
        } else {
          for (const product of matchingProducts) {
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
                payment_id: existingPayment?.id || null
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

    console.log('[RAZORPAY-WEBHOOK] === PRODUCTION WEBHOOK PROCESSING COMPLETED ===')
    return new Response('Success', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('[RAZORPAY-WEBHOOK] CRITICAL ERROR:', error)
    return new Response('Server error', { status: 500, headers: corsHeaders })
  }
})
