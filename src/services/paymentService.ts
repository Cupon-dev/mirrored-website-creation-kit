
import { supabase } from '@/integrations/supabase/client';

export interface PaymentResult {
  success: boolean;
  accessGranted: boolean;
  message: string;
  error?: string;
  paymentId?: string;
  driveLink?: string;
  whatsappGroup?: string;
}

// Record payment attempt in database (will be auto-verified if has Razorpay ID)
export const recordPayment = async (
  userEmail: string,
  productId: string,
  amount: number,
  paymentMethod: 'razorpay' | 'upi' | 'manual_verification',
  additionalData?: {
    transactionId?: string;
    upiRefId?: string;
    paymentProofUrl?: string;
    razorpayPaymentId?: string;
  }
): Promise<PaymentResult> => {
  try {
    console.log('🔒 Recording payment attempt:', { userEmail, productId, amount, paymentMethod });

    // Find or create user
    let userData;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', userEmail)
      .single();

    if (!existingUser) {
      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          name: userEmail.split('@')[0],
          mobile_number: '0000000000', // Default mobile number
          is_verified: true
        })
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create user account');
      }
      userData = newUser;
    } else {
      userData = existingUser;
    }

    // Check if user already has access
    const { data: existingAccess } = await supabase
      .from('user_product_access')
      .select('*')
      .eq('user_id', userData.id)
      .eq('product_id', productId)
      .single();

    if (existingAccess) {
      return {
        success: true,
        accessGranted: true,
        message: 'You already have access to this product!'
      };
    }

    // Determine initial status based on payment method and data
    let initialStatus = 'pending_verification';
    let autoVerified = false;

    if (additionalData?.razorpayPaymentId) {
      // Has Razorpay payment ID - will be auto-verified by trigger
      initialStatus = 'pending'; // Trigger will change to 'completed'
      autoVerified = true;
    }

    // Record payment in database
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userData.id,
        email: userEmail,
        amount: amount,
        status: initialStatus,
        payment_method: paymentMethod,
        razorpay_payment_id: additionalData?.razorpayPaymentId,
        transaction_id: additionalData?.transactionId,
        upi_reference_id: additionalData?.upiRefId,
        payment_proof_url: additionalData?.paymentProofUrl,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error('Failed to record payment: ' + paymentError.message);
    }

    // Store payment info for reference
    localStorage.setItem('pending_payment', JSON.stringify({
      paymentId: paymentRecord.id,
      productId: productId,
      email: userEmail,
      amount: amount,
      method: paymentMethod
    }));

    // Return appropriate message based on payment type
    const messages = {
      'razorpay': autoVerified 
        ? 'Payment recorded! Access will be granted automatically within minutes.'
        : 'Payment recorded! Access will be granted after verification.',
      'upi': `Payment recorded! Send ₹${amount} to creativevibes1993-1@okaxis. Access granted within 30 minutes after admin verification.`,
      'manual_verification': 'Payment proof uploaded! Our team will verify within 2 hours and grant access.'
    };

    return {
      success: true,
      accessGranted: autoVerified,
      message: messages[paymentMethod],
      paymentId: paymentRecord.id
    };

  } catch (error: any) {
    console.error('❌ Payment recording failed:', error);
    return {
      success: false,
      accessGranted: false,
      message: 'Failed to record payment',
      error: error.message
    };
  }
};

// Check payment status
export const checkPaymentStatus = async (paymentId: string): Promise<PaymentResult> => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*, user_product_access(*)')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return {
        success: false,
        accessGranted: false,
        message: 'Payment not found'
      };
    }

    const isCompleted = payment.status === 'completed';
    const hasAccess = payment.user_product_access && payment.user_product_access.length > 0;

    return {
      success: true,
      accessGranted: isCompleted && hasAccess,
      message: isCompleted 
        ? 'Payment verified and access granted!'
        : 'Payment is being processed...'
    };

  } catch (error: any) {
    return {
      success: false,
      accessGranted: false,
      message: 'Error checking payment status',
      error: error.message
    };
  }
};

// Legacy function for backward compatibility
export const verifyPaymentAndGrantAccess = async (
  userEmail: string, 
  userId?: string,
  paymentId?: string,
  productId?: string
): Promise<PaymentResult> => {
  // For backward compatibility, just check if user has access
  if (!userId) return { success: false, accessGranted: false, message: 'User ID required' };
  
  const { data: userAccess } = await supabase
    .from('user_product_access')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  return {
    success: true,
    accessGranted: userAccess && userAccess.length > 0,
    message: userAccess && userAccess.length > 0 
      ? 'User has verified access'
      : 'No verified access found'
  };
};
