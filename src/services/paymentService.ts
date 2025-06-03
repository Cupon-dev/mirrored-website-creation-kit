
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
    console.log('Verifying payment for email:', email);

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
      return { success: false, error: 'No completed payments found' };
    }

    const latestPayment = payments[0];
    console.log('Found completed payment:', latestPayment.id);

    // Grant access to the user if they're logged in
    if (userId) {
      const { error: accessError } = await supabase
        .from('user_product_access')
        .insert({
          user_id: userId,
          product_id: 'digital-product-1', // Default product for now
          payment_id: latestPayment.id
        })
        .select()
        .single();

      if (accessError && !accessError.message.includes('duplicate')) {
        console.error('Error granting access:', accessError);
        return { success: false, error: 'Failed to grant access' };
      }
    }

    return {
      success: true,
      accessGranted: true,
      driveLink: latestPayment.google_drive_link,
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
