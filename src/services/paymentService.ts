import { supabase } from '@/integrations/supabase/client';

export interface PaymentVerificationResult {
  success: boolean;
  accessGranted: boolean;
  driveLink?: string;
  whatsappGroup?: string;
  error?: string;
  message?: string;
}

export const verifyPaymentAndGrantAccess = async (
  userEmail: string, 
  userId?: string,
  paymentId?: string,
  productId?: string
): Promise<PaymentVerificationResult> => {
  try {
    console.log('🔒 SERVER-SIDE Payment verification started:', { userEmail, userId, paymentId, productId });
    
    // Get product ID from localStorage if not provided
    if (!productId) {
      const pendingPayment = localStorage.getItem('pending_payment');
      if (pendingPayment) {
        try {
          const paymentData = JSON.parse(pendingPayment);
          productId = paymentData.productId;
        } catch (error) {
          console.error('Error parsing pending payment:', error);
        }
      }
    }

    if (!productId) {
      console.error('No product ID available for verification');
      return {
        success: false,
        accessGranted: false,
        error: 'No product ID found'
      };
    }

    // Call the secure Edge Function instead of client-side verification
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        payment_id: paymentId,
        user_email: userEmail,
        product_id: productId
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        accessGranted: false,
        error: error.message
      };
    }

    console.log('✅ Server verification result:', data);

    return {
      success: data.success,
      accessGranted: data.accessGranted,
      driveLink: data.driveLink,
      message: data.message,
      error: data.error
    };

  } catch (error: any) {
    console.error('❌ Payment verification failed:', error);
    return {
      success: false,
      accessGranted: false,
      error: error.message
    };
  }
};

// New function for multi-method payments
export const initiateMultiPayment = async (
  userEmail: string,
  productId: string,
  amount: number,
  paymentMethod: 'razorpay' | 'upi' | 'manual_verification',
  additionalData?: {
    transactionId?: string;
    upiRefId?: string;
    paymentProofUrl?: string;
  }
): Promise<PaymentVerificationResult> => {
  try {
    console.log('🔒 Initiating multi-method payment:', { userEmail, productId, amount, paymentMethod });

    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        user_email: userEmail,
        product_id: productId,
        amount: amount,
        payment_method: paymentMethod,
        transaction_id: additionalData?.transactionId,
        upi_ref_id: additionalData?.upiRefId,
        payment_proof_url: additionalData?.paymentProofUrl,
      }
    });

    if (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        accessGranted: false,
        error: error.message
      };
    }

    console.log('✅ Payment initiated successfully:', data);

    return {
      success: data.success,
      accessGranted: data.accessGranted,
      driveLink: data.driveLink,
      message: data.message,
      error: data.error
    };

  } catch (error: any) {
    console.error('❌ Payment initiation failed:', error);
    return {
      success: false,
      accessGranted: false,
      error: error.message
    };
  }
};
