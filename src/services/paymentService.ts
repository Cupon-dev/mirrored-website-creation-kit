
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
    console.log('=== PAYMENT VERIFICATION STARTED ===');
    console.log('Email:', email, 'User ID:', userId);

    // Enhanced payment query with better filtering
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    console.log('Payment query result:', { 
      paymentsFound: payments?.length || 0, 
      error: paymentError?.message,
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
      console.error('Database error:', paymentError);
      return { 
        success: false, 
        error: 'Database error while checking payments',
        debugInfo: { paymentError, email }
      };
    }

    if (!payments || payments.length === 0) {
      console.log('No payment records found');
      return { 
        success: false, 
        error: 'No payment records found',
        debugInfo: { email, totalPayments: 0 }
      };
    }

    // Analyze payment statuses
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const failedPayments = payments.filter(p => p.status === 'failed');
    const paymentsWithRazorpayId = payments.filter(p => p.razorpay_payment_id);

    console.log('Payment analysis:', {
      total: payments.length,
      completed: completedPayments.length,
      pending: pendingPayments.length,
      failed: failedPayments.length,
      withRazorpayId: paymentsWithRazorpayId.length
    });

    // Try to auto-complete pending payments with Razorpay IDs
    for (const pendingPayment of pendingPayments) {
      if (pendingPayment.razorpay_payment_id && !pendingPayment.verified_at) {
        console.log('Auto-completing pending payment with Razorpay ID:', pendingPayment.id);
        
        const { error: updateError } = await supabase
          .from('payments')
          .update({ 
            status: 'completed',
            verified_at: new Date().toISOString()
          })
          .eq('id', pendingPayment.id);

        if (!updateError) {
          console.log('Successfully auto-completed payment:', pendingPayment.id);
          // Add to completed payments
          completedPayments.push({
            ...pendingPayment,
            status: 'completed',
            verified_at: new Date().toISOString()
          });
        } else {
          console.error('Failed to auto-complete payment:', updateError);
        }
      }
    }

    if (completedPayments.length === 0) {
      let errorMessage = 'No completed payments found.';
      let suggestion = '';

      if (pendingPayments.length > 0) {
        errorMessage = 'Payment found but still processing.';
        suggestion = 'Your payment is being processed. Please wait and try again.';
      } else if (failedPayments.length > 0) {
        errorMessage = 'Payment failed. Please try again.';
        suggestion = 'Previous payment attempts failed. Please make a new payment.';
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
          suggestion,
          latestPayment: payments[0]
        }
      };
    }

    const latestPayment = completedPayments[0];
    console.log('Using latest completed payment:', latestPayment.id);

    // Grant access if user is logged in
    if (userId) {
      console.log('Granting access to user:', userId);
      
      const { data: existingAccess, error: accessCheckError } = await supabase
        .from('user_product_access')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('product_id', 'digital-product-1')
        .single();

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
        console.log('Access already exists');
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
        totalPaymentsChecked: payments.length,
        completedPayments: completedPayments.length
      }
    };

  } catch (error) {
    console.error('Payment verification error:', error);
    return { 
      success: false, 
      error: 'Payment verification system error',
      debugInfo: { error: error.message, email, userId }
    };
  }
};

export const checkPaymentStatus = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('status, razorpay_payment_id')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking payment status:', error);
      return false;
    }

    if (data && data.length > 0) {
      const payment = data[0];
      // Consider payment successful if it's completed OR has a Razorpay payment ID
      return payment.status === 'completed' || !!payment.razorpay_payment_id;
    }

    return false;
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

// New function to manually fix stuck payments
export const fixStuckPayments = async (email: string) => {
  try {
    console.log('Fixing stuck payments for:', email);
    
    // Find payments with Razorpay payment IDs but still pending
    const { data: stuckPayments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .not('razorpay_payment_id', 'is', null);

    if (error) {
      console.error('Error finding stuck payments:', error);
      return { success: false, error: error.message };
    }

    if (!stuckPayments || stuckPayments.length === 0) {
      console.log('No stuck payments found');
      return { success: true, message: 'No stuck payments found' };
    }

    console.log('Found stuck payments:', stuckPayments.length);
    
    // Update all stuck payments to completed
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        verified_at: new Date().toISOString()
      })
      .eq('email', email)
      .eq('status', 'pending')
      .not('razorpay_payment_id', 'is', null);

    if (updateError) {
      console.error('Error fixing stuck payments:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('Successfully fixed stuck payments');
    return { 
      success: true, 
      message: `Fixed ${stuckPayments.length} stuck payment(s)`,
      fixedCount: stuckPayments.length
    };

  } catch (error) {
    console.error('Fix stuck payments error:', error);
    return { success: false, error: error.message };
  }
};
