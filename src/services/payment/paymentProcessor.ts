
import { updatePaymentStatus } from './paymentQueries';

export const autoCompleteStuckPayments = async (pendingPayments: any[]) => {
  const updatedPayments = [];
  
  for (const pendingPayment of pendingPayments) {
    if (pendingPayment.razorpay_payment_id && !pendingPayment.verified_at) {
      console.log('Auto-completing pending payment with Razorpay ID:', pendingPayment.id);
      
      const { error: updateError } = await updatePaymentStatus(pendingPayment.id, 'completed');

      if (!updateError) {
        console.log('Successfully auto-completed payment:', pendingPayment.id);
        // Add to completed payments
        updatedPayments.push({
          ...pendingPayment,
          status: 'completed',
          verified_at: new Date().toISOString()
        });
      } else {
        console.error('Failed to auto-complete payment:', updateError);
      }
    }
  }
  
  return updatedPayments;
};
