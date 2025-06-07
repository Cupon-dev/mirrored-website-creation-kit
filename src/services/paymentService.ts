import { supabase } from '@/integrations/supabase/client';

export interface PaymentVerificationResult {
  success: boolean;
  accessGranted?: boolean;
  driveLink?: string;
  whatsappGroup?: string;
  error?: string;
  debugInfo?: any;
}

export const verifyPaymentAndGrantAccess = async (
  email: string,
  userId?: string
): Promise<PaymentVerificationResult> => {
  try {
    console.log('=== PAYMENT VERIFICATION DEBUG ===');
    console.log('Verifying payment for email:', email, 'userId:', userId);

    // Check for completed payments for this email
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    console.log('Payment query result:', { payments, paymentError });

    if (paymentError) {
      console.error('Error checking payments:', paymentError);
      return { 
        success: false, 
        error: 'Failed to verify payment',
        debugInfo: { paymentError }
      };
    }

    if (!payments || payments.length === 0) {
      console.log('No payments found for email:', email);
      return { 
        success: false, 
        error: 'No payments found',
        debugInfo: { paymentsFound: 0, email }
      };
    }

    // Log all payment statuses
    console.log('Found payments with statuses:', payments.map(p => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      created_at: p.created_at
    })));

    // Check for any completed payments
    const completedPayments = payments.filter(p => p.status === 'completed');
    console.log('Completed payments:', completedPayments.length);

    if (completedPayments.length === 0) {
      // Check for pending payments that might need manual verification
      const pendingPayments = payments.filter(p => p.status === 'pending');
      console.log('Pending payments found:', pendingPayments.length);
      
      return { 
        success: false, 
        error: 'No completed payments found. Payment may still be processing.',
        debugInfo: { 
          totalPayments: payments.length,
          completedPayments: 0,
          pendingPayments: pendingPayments.length,
          paymentStatuses: payments.map(p => p.status)
        }
      };
    }

    const latestPayment = completedPayments[0];
    console.log('Using latest completed payment:', latestPayment.id);

    // Grant access to the user if they're logged in
    if (userId) {
      console.log('Granting access to user:', userId);
      
      // Check if access already exists
      const { data: existingAccess, error: accessCheckError } = await supabase
        .from('user_product_access')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', 'digital-product-1')
        .single();

      console.log('Existing access check:', { existingAccess, accessCheckError });

      if (!existingAccess) {
        const { error: accessError } = await supabase
          .from('user_product_access')
          .insert({
            user_id: userId,
            product_id: 'digital-product-1',
            payment_id: latestPayment.id
          });

        if (accessError) {
          console.error('Error granting access:', accessError);
          return { 
            success: false, 
            error: 'Failed to grant access',
            debugInfo: { accessError }
          };
        }
        console.log('Access granted successfully');
      } else {
        console.log('Access already exists for user');
      }
    }

    return {
      success: true,
      accessGranted: true,
      driveLink: latestPayment.google_drive_link || '',
      whatsappGroup: "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X",
      debugInfo: {
        paymentId: latestPayment.id,
        paymentAmount: latestPayment.amount,
        paymentDate: latestPayment.created_at
      }
    };

  } catch (error) {
    console.error('Payment verification error:', error);
    return { 
      success: false, 
      error: 'Payment verification failed',
      debugInfo: { error: error.message }
    };
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
