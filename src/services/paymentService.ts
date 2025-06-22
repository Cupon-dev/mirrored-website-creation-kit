import { supabase } from '@/integrations/supabase/client';

export interface PaymentVerificationResult {
  success: boolean;
  accessGranted: boolean;
  driveLink?: string;
  whatsappGroup?: string;
  error?: string;
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
