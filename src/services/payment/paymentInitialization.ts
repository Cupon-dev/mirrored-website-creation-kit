
import { supabase } from '@/integrations/supabase/client';
import { createPaymentRecord } from './paymentQueries';
import type { PaymentInitializationResult } from './types';

export const initializePayment = async (
  email: string,
  phoneNumber: string,
  amount: number,
  productId: string
): Promise<PaymentInitializationResult> => {
  try {
    console.log('Initializing payment for:', { email, phoneNumber, amount, productId });

    // Create payment record in our database first
    const { payment, error: paymentError } = await createPaymentRecord(
      email,
      phoneNumber,
      amount,
      '' // We'll update with order ID after Razorpay response
    );

    if (paymentError || !payment) {
      console.error('Error creating payment record:', paymentError);
      return {
        success: false,
        error: 'Failed to create payment record'
      };
    }

    // Create Razorpay order
    const orderData = {
      amount: amount * 100, // Convert to paisa
      currency: 'INR',
      receipt: payment.id,
      notes: {
        email: email,
        phone: phoneNumber,
        product_id: productId,
        payment_id: payment.id
      }
    };

    // Call our edge function to create Razorpay order
    const { data: orderResponse, error: orderError } = await supabase.functions.invoke(
      'create-razorpay-order',
      {
        body: orderData
      }
    );

    if (orderError || !orderResponse?.success) {
      console.error('Error creating Razorpay order:', orderError);
      return {
        success: false,
        error: 'Failed to create payment order'
      };
    }

    // Update payment record with Razorpay order ID
    await supabase
      .from('payments')
      .update({ razorpay_order_id: orderResponse.order.id })
      .eq('id', payment.id);

    // Store pending payment info in localStorage
    localStorage.setItem('pending_payment', JSON.stringify({
      paymentId: payment.id,
      email: email,
      amount: amount,
      productId: productId
    }));

    console.log('Payment initialization successful:', orderResponse.order);

    return {
      success: true,
      orderId: orderResponse.order.id,
      amount: amount,
      currency: 'INR',
      name: 'PremiumLeaks',
      description: 'Digital Product Purchase',
      paymentId: payment.id,
      razorpayOrderId: orderResponse.order.id,
      prefill: {
        email: email,
        contact: phoneNumber
      },
      notes: orderData.notes
    };

  } catch (error) {
    console.error('Payment initialization error:', error);
    return {
      success: false,
      error: 'Payment system error'
    };
  }
};
