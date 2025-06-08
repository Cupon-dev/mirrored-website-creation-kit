
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const payload = await req.json()
    console.log('[RAZORPAY-WEBHOOK] Raw webhook payload received -', JSON.stringify(payload, null, 2))

    if (payload.event !== 'payment.captured') {
      return new Response('Event not handled', { status: 200, headers: corsHeaders })
    }

    const paymentEntity = payload.payload.payment.entity
    const paymentId = paymentEntity.id
    const orderId = paymentEntity.order_id
    const status = paymentEntity.status
    const amount = paymentEntity.amount / 100 // Convert from paisa to rupees
    const captured = paymentEntity.captured
    const email = paymentEntity.email || paymentEntity.notes?.email
    const phone = paymentEntity.contact || paymentEntity.notes?.phone

    console.log('[RAZORPAY-WEBHOOK] Processing payment entity -', {
      paymentId,
      orderId,
      status,
      amount,
      captured,
      email,
      contact: phone
    })

    if (!email) {
      console.log('[RAZORPAY-WEBHOOK] No email found in payment data')
      return new Response('No email found', { status: 400, headers: corsHeaders })
    }

    console.log('[RAZORPAY-WEBHOOK] Extracted payment details -', {
      email,
      phone,
      allNotes: paymentEntity.notes
    })

    if (status !== 'captured' || !captured) {
      console.log('[RAZORPAY-WEBHOOK] Payment not captured, skipping')
      return new Response('Payment not captured', { status: 200, headers: corsHeaders })
    }

    // First, try to find payment by Razorpay order ID
    console.log('[RAZORPAY-WEBHOOK] Searching by Razorpay order ID -', { orderId })
    
    let { data: existingPayment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single()

    let searchMethod = 'order_id'
    let paymentRecord = existingPayment

    if (paymentError || !existingPayment) {
      console.log('[RAZORPAY-WEBHOOK] No payment found by order ID -', {})
      
      // Try to find by email for pending payments
      console.log('[RAZORPAY-WEBHOOK] Searching by email for pending payments -', { email })
      
      const { data: pendingPayments, error: pendingError } = await supabase
        .from('payments')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      if (pendingError || !pendingPayments || pendingPayments.length === 0) {
        console.log('[RAZORPAY-WEBHOOK] No pending payment found by email -', {})
        
        // As last resort, find recent payment by email (within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        console.log('[RAZORPAY-WEBHOOK] Searching for recent payment by email -', { email, since: oneHourAgo })
        
        const { data: recentPayments, error: recentError } = await supabase
          .from('payments')
          .select('*')
          .eq('email', email)
          .gte('created_at', oneHourAgo)
          .order('created_at', { ascending: false })
          .limit(1)

        if (recentError || !recentPayments || recentPayments.length === 0) {
          console.log('[RAZORPAY-WEBHOOK] No recent payment found, creating new record')
          
          // Create a new payment record
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
            console.error('[RAZORPAY-WEBHOOK] Error creating payment record -', createError)
            return new Response('Database error', { status: 500, headers: corsHeaders })
          }

          paymentRecord = newPayment
          searchMethod = 'created_new'
        } else {
          paymentRecord = recentPayments[0]
          searchMethod = 'email_recent'
          console.log('[RAZORPAY-WEBHOOK] Found recent payment by email -', { paymentId: paymentRecord.id })
        }
      } else {
        paymentRecord = pendingPayments[0]
        searchMethod = 'email_pending'
        console.log('[RAZORPAY-WEBHOOK] Found pending payment by email -', { paymentId: paymentRecord.id })
      }
    } else {
      console.log('[RAZORPAY-WEBHOOK] Found payment by order ID -', { paymentId: paymentRecord.id })
    }

    // Update the payment record
    console.log('[RAZORPAY-WEBHOOK] Updating existing payment record -', {
      paymentId: paymentRecord.id,
      searchMethod,
      currentStatus: paymentRecord.status
    })

    const updateData = {
      razorpay_payment_id: paymentId,
      status: 'completed',
      verified_at: new Date().toISOString(),
      razorpay_order_id: orderId
    }

    console.log('[RAZORPAY-WEBHOOK] Updating with data -', updateData)

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentRecord.id)

    if (updateError) {
      console.error('[RAZORPAY-WEBHOOK] ERROR updating payment record -', { error: updateError })
      return new Response('Update failed', { status: 500, headers: corsHeaders })
    }

    console.log('[RAZORPAY-WEBHOOK] Updated payment record successfully -', {
      paymentId: paymentRecord.id,
      newStatus: 'completed'
    })

    // Grant product access if payment is completed
    console.log('[RAZORPAY-WEBHOOK] Payment completed, checking for user to grant access -', { email })

    // Find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single()

    let accessGranted = false

    if (userError || !userData) {
      console.log('[RAZORPAY-WEBHOOK] No user found with email, access will be granted when user logs in')
    } else {
      console.log('[RAZORPAY-WEBHOOK] Found user, granting product access -', {
        userId: userData.id,
        userName: userData.name
      })

      // Get all active products to determine which one to grant access to
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, name')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (productsError || !productsData || productsData.length === 0) {
        console.log('[RAZORPAY-WEBHOOK] No active products found')
      } else {
        console.log('[RAZORPAY-WEBHOOK] Available products -', {
          paymentAmount: amount,
          products: productsData.map(p => ({ id: p.id, name: p.name, price: p.price }))
        })

        // Find the product that matches the payment amount
        const matchingProducts = productsData.filter(product => {
          const productPrice = Number(product.price || 0)
          const matches = Math.abs(productPrice - amount) < 0.01 // Allow for small floating point differences
          console.log('[RAZORPAY-WEBHOOK] Checking product match -', {
            productName: product.name,
            productPrice,
            paymentAmount: amount,
            matches
          })
          return matches
        })

        console.log('[RAZORPAY-WEBHOOK] Found matching products -', {
          paymentAmount: amount,
          matchingCount: matchingProducts.length,
          matchingProducts: matchingProducts.map(p => ({ id: p.id, name: p.name, price: p.price }))
        })

        // Grant access to all matching products (or first product if no exact match)
        const productsToGrantAccess = matchingProducts.length > 0 ? matchingProducts : [productsData[0]]

        for (const product of productsToGrantAccess) {
          console.log('[RAZORPAY-WEBHOOK] Processing access grant for product -', {
            productId: product.id,
            productName: product.name,
            productPrice: product.price
          })

          // Check if access already exists
          const { data: existingAccess, error: accessCheckError } = await supabase
            .from('user_product_access')
            .select('id, created_at')
            .eq('user_id', userData.id)
            .eq('product_id', product.id)
            .maybeSingle()

          if (existingAccess) {
            console.log('[RAZORPAY-WEBHOOK] Access already exists -', {
              existingAccessId: existingAccess.id,
              productId: product.id,
              productName: product.name
            })
            continue
          }

          // Grant access to this specific product
          console.log('[RAZORPAY-WEBHOOK] Granting access to product -', {
            userId: userData.id,
            productId: product.id,
            productName: product.name,
            paymentId: paymentRecord.id
          })

          const { error: accessError } = await supabase
            .from('user_product_access')
            .insert({
              user_id: userData.id,
              product_id: product.id,
              payment_id: paymentRecord.id
            })

          if (accessError) {
            console.error('[RAZORPAY-WEBHOOK] ERROR granting access to product -', {
              error: accessError,
              productId: product.id,
              productName: product.name,
              userId: userData.id
            })
          } else {
            console.log('[RAZORPAY-WEBHOOK] Successfully granted access to product -', {
              productId: product.id,
              productName: product.name,
              userId: userData.id
            })
            accessGranted = true
          }
        }
      }
    }

    console.log('[RAZORPAY-WEBHOOK] === WEBHOOK PROCESSING COMPLETED SUCCESSFULLY === -', {
      paymentId,
      email,
      recordId: paymentRecord.id,
      status: 'completed',
      searchMethod,
      userFound: !!userData,
      accessGranted
    })

    return new Response('Success', { status: 200, headers: corsHeaders })

  } catch (error) {
    console.error('[RAZORPAY-WEBHOOK] ERROR processing webhook -', error)
    return new Response('Server error', { status: 500, headers: corsHeaders })
  }
})
