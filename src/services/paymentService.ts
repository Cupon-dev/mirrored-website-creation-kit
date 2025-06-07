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
    console.log('=== ENHANCED PAYMENT VERIFICATION ===');
    console.log('Verifying payment for email:', email, 'userId:', userId);

    // Check for completed payments for this email with enhanced query
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    console.log('Payment query result:', { 
      paymentsCount: payments?.length || 0, 
      paymentError,
      payments: payments?.map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        razorpay_payment_id: p.razorpay_payment_id,
        razorpay_order_id: p.razorpay_order_id,
        verified_at: p.verified_at,
        created_at: p.created_at
      }))
    });

    if (paymentError) {
      console.error('Database error checking payments:', paymentError);
      return { 
        success: false, 
        error: 'Database error while checking payments',
        debugInfo: { paymentError, email }
      };
    }

    if (!payments || payments.length === 0) {
      console.log('No payment records found for email:', email);
      return { 
        success: false, 
        error: 'No payment records found for this email',
        debugInfo: { 
          email,
          suggestion: 'Payment may not have been initiated yet or email mismatch'
        }
      };
    }

    // Detailed analysis of payment statuses
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const failedPayments = payments.filter(p => p.status === 'failed');

    console.log('Payment status breakdown:', {
      total: payments.length,
      completed: completedPayments.length,
      pending: pendingPayments.length,
      failed: failedPayments.length
    });

    // Check for payments with Razorpay payment IDs but still pending
    const paymentsWithRazorpayId = payments.filter(p => p.razorpay_payment_id);
    console.log('Payments with Razorpay payment IDs:', paymentsWithRazorpayId.length);

    if (completedPayments.length === 0) {
      // More detailed error messaging
      let errorMessage = 'No completed payments found.';
      let suggestion = '';

      if (pendingPayments.length > 0) {
        errorMessage = 'Payment found but still processing.';
        suggestion = 'Your payment is being processed. Please wait a few minutes and try again.';
        
        if (paymentsWithRazorpayId.length > 0) {
          suggestion += ' If this persists, please contact support with your payment ID.';
        }
      } else if (failedPayments.length > 0) {
        errorMessage = 'Payment failed. Please try again.';
        suggestion = 'Your previous payment attempt failed. Please initiate a new payment.';
      }

      return { 
        success: false, 
        error: errorMessage,
        debugInfo: { 
          email,
          totalPayments: payments.length,
          completedPayments: 0,
          pendingPayments: pendingPayments.length,
          failedPayments: failedPayments.length,
          paymentsWithRazorpayId: paymentsWithRazorpayId.length,
          suggestion,
          latestPayment: payments[0] ? {
            id: payments[0].id,
            status: payments[0].status,
            amount: payments[0].amount,
            created_at: payments[0].created_at,
            razorpay_payment_id: payments[0].razorpay_payment_id
          } : null
        }
      };
    }

    const latestPayment = completedPayments[0];
    console.log('Using latest completed payment:', {
      id: latestPayment.id,
      amount: latestPayment.amount,
      razorpay_payment_id: latestPayment.razorpay_payment_id,
      verified_at: latestPayment.verified_at
    });

    // Grant access to the user if they're logged in
    if (userId) {
      console.log('Granting access to user:', userId);
      
      // Check if access already exists
      const { data: existingAccess, error: accessCheckError } = await supabase
        .from('user_product_access')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('product_id', 'digital-product-1')
        .single();

      console.log('Existing access check:', { 
        hasAccess: !!existingAccess, 
        accessCheckError: accessCheckError?.message 
      });

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
            error: 'Failed to grant product access',
            debugInfo: { accessError, userId, paymentId: latestPayment.id }
          };
        }
        console.log('Access granted successfully');
      } else {
        console.log('Access already exists since:', existingAccess.created_at);
      }
    }

    console.log('=== PAYMENT VERIFICATION SUCCESSFUL ===');
    return {
      success: true,
      accessGranted: true,
      driveLink: latestPayment.google_drive_link || '',
      whatsappGroup: "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X",
      debugInfo: {
        paymentId: latestPayment.id,
        razorpayPaymentId: latestPayment.razorpay_payment_id,
        paymentAmount: latestPayment.amount,
        paymentDate: latestPayment.created_at,
        verifiedAt: latestPayment.verified_at,
        totalPaymentsChecked: payments.length
      }
    };

  } catch (error) {
    console.error('Critical error in payment verification:', error);
    return { 
      success: false, 
      error: 'Payment verification system error',
      debugInfo: { 
        error: error.message,
        email,
        userId,
        timestamp: new Date().toISOString()
      }
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
