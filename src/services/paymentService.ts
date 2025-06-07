
import { supabase } from '@/integrations/supabase/client';

export interface PaymentVerificationResult {
  success: boolean;
  accessGranted?: boolean;
  driveLink?: string;
  whatsappGroup?: string;
  error?: string;
}

export const verifyPaymentAndGrantAccess = async (
  email: string,
  userId?: string
): Promise<PaymentVerificationResult> => {
  try {
    console.log('Verifying payment for email:', email, 'userId:', userId);

    // Check for completed payments for this email
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('email', email)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (paymentError) {
      console.error('Error checking payments:', paymentError);
      return { success: false, error: 'Failed to verify payment' };
    }

    if (!payments || payments.length === 0) {
      console.log('No completed payments found for email:', email);
      return { success: false, error: 'No completed payments found' };
    }

    const latestPayment = payments[0];
    console.log('Found completed payment:', latestPayment.id);

    // Grant access to the user if they're logged in
    if (userId) {
      console.log('Granting access to user:', userId);
      
      const { error: accessError } = await supabase
        .from('user_product_access')
        .upsert({
          user_id: userId,
          product_id: 'digital-product-1',
          payment_id: latestPayment.id
        }, {
          onConflict: 'user_id,product_id'
        });

      if (accessError) {
        console.error('Error granting access:', accessError);
        return { success: false, error: 'Failed to grant access' };
      }
      console.log('Access granted successfully');
    }

    return {
      success: true,
      accessGranted: true,
      driveLink: latestPayment.google_drive_link || '',
      whatsappGroup: "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X"
    };

  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, error: 'Payment verification failed' };
  }
};

export const checkPaymentStatus = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('status')
      .eq('email', email)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking payment status:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Payment status check error:', error);
    return false;
  }
};

export const initializePayment = async (email: string, phoneNumber: string, amount: number) => {
  try {
    console.log('Initializing payment for:', email, amount);
    
    const orderIdSuffix = Math.random().toString(36).substring(2, 8);
    const razorpayOrderId = `order_${Date.now()}_${orderIdSuffix}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        email: email,
        mobile_number: phoneNumber,
        amount: amount,
        google_drive_link: "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link",
        razorpay_order_id: razorpayOrderId,
        status: 'pending'
      }])
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw new Error('Failed to create payment record');
    }

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
