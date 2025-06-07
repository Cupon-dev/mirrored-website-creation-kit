
import { getPaymentsByEmail } from './paymentQueries';
import { analyzePayments, generateErrorMessage } from './paymentAnalyzer';
import { autoCompleteStuckPayments } from './paymentProcessor';
import { grantProductAccess } from './accessManager';
import type { PaymentVerificationResult } from './types';

export const verifyPaymentAndGrantAccess = async (
  email: string,
  userId?: string
): Promise<PaymentVerificationResult> => {
  try {
    console.log('=== PAYMENT VERIFICATION STARTED ===');
    console.log('Email:', email, 'User ID:', userId);

    // Enhanced payment query with better filtering
    const { payments, error: paymentError } = await getPaymentsByEmail(email);

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
    const { completedPayments, pendingPayments, failedPayments, stats } = analyzePayments(payments);

    console.log('Payment analysis:', stats);

    // Try to auto-complete pending payments with Razorpay IDs
    const autoCompletedPayments = await autoCompleteStuckPayments(pendingPayments);
    completedPayments.push(...autoCompletedPayments);

    if (completedPayments.length === 0) {
      const errorInfo = generateErrorMessage(completedPayments, pendingPayments, failedPayments);
      
      if (errorInfo) {
        return { 
          success: false, 
          error: errorInfo.errorMessage,
          debugInfo: { 
            email,
            totalPayments: payments.length,
            completedPayments: 0,
            pendingPayments: pendingPayments.length,
            failedPayments: failedPayments.length,
            suggestion: errorInfo.suggestion,
            latestPayment: payments[0]
          }
        };
      }
    }

    const latestPayment = completedPayments[0];
    console.log('Using latest completed payment:', latestPayment.id);

    // Grant access if user is logged in
    if (userId) {
      const accessResult = await grantProductAccess(userId, latestPayment);
      if (!accessResult.success) {
        return accessResult as PaymentVerificationResult;
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
