
import { findStuckPayments, fixStuckPaymentsByEmail } from './paymentQueries';
import type { StuckPaymentsResult } from './types';

export const fixStuckPayments = async (email: string): Promise<StuckPaymentsResult> => {
  try {
    console.log('Fixing stuck payments for:', email);
    
    // Find payments with Razorpay payment IDs but still pending
    const { stuckPayments, error } = await findStuckPayments(email);

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
    const { error: updateError } = await fixStuckPaymentsByEmail(email);

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
