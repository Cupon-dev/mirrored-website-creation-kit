
import { supabase } from '@/integrations/supabase/client';

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
