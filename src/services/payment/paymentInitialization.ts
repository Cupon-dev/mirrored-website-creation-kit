
import { createPaymentRecord } from './paymentQueries';
import type { PaymentInitializationResult } from './types';

export const initializePayment = async (
  email: string, 
  phoneNumber: string, 
  amount: number
): Promise<PaymentInitializationResult> => {
  try {
    console.log('Initializing payment for:', email, amount);
    
    const orderIdSuffix = Math.random().toString(36).substring(2, 8);
    const razorpayOrderId = `order_${Date.now()}_${orderIdSuffix}`;

    const { payment, error: paymentError } = await createPaymentRecord(
      email, 
      phoneNumber, 
      amount, 
      razorpayOrderId
    );

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw new Error('Failed to create payment record');
    }

    console.log('Payment initialized successfully:', payment.id);
    return {
      success: true,
      paymentId: payment.id,
      razorpayOrderId: razorpayOrderId
    };

  } catch (error) {
    console.error('Payment initialization error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
