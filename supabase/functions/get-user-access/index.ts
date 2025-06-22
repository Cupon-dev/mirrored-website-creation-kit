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
    const { user_id, user_email } = await req.json()
    
    console.log('🔒 SECURE: Getting user access for:', { user_id, user_email })
    
    // Initialize Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 🔒 SERVER-SIDE VERIFICATION: Query with payment verification
    const { data: accessData, error: accessError } = await supabase
      .from('user_product_access')
      .select(`
        product_id,
        created_at,
        payment_id,
        payments!inner(
          status,
          verified_at,
          razorpay_payment_id,
          amount
        )
      `)
      .eq('user_id', user_id)

    if (accessError) {
      console.error('❌ Error fetching user access:', accessError)
      throw new Error('Failed to fetch user access')
    }

    let validProductIds: string[] = []

    if (accessData && accessData.length > 0) {
      // 🔒 STRICT VERIFICATION: Only include access with verified payments
      const validAccess = accessData.filter(item => {
        const payment = item.payments
        const isValid = payment && (
          (payment.status === 'completed' && payment.verified_at) ||
          (payment.status === 'completed' && payment.razorpay_payment_id)
        )
        
        console.log('🔍 Server-side access verification:', {
          productId: item.product_id,
          paymentId: item.payment_id,
          isValid: isValid ? '✅' : '❌',
          paymentStatus: payment?.status,
          hasVerifiedAt: !!payment?.verified_at,
          hasRazorpayId: !!payment?.razorpay_payment_id,
          amount: payment?.amount
        })
        
        return isValid
      })

      validProductIds = validAccess.map(item => item.product_id)
      console.log('✅ VERIFIED: User has valid access to:', validProductIds)
    } else {
      console.log('ℹ️ No access records found for user')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        productIds: validProductIds,
        totalAccess: validProductIds.length
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('❌ Error in get-user-access:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        productIds: []
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
