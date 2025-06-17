
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
    console.log('=== STRICT PAYMENT VERIFICATION STARTED ===');
    console.log('Email:', email, 'User ID:', userId);

    if (!email || !userId) {
      console.log('Missing required parameters for verification');
      return { 
        success: false, 
        error: 'Invalid verification parameters - email and userId required',
        debugInfo: { email: !!email, userId: !!userId }
      };
    }

    // Get payments with strict filtering
    const { payments, error: paymentError } = await getPaymentsByEmail(email);

    console.log('Payment query result:', { 
      paymentsFound: payments?.length || 0, 
      error: paymentError?.message,
      payments: payments?.map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        razorpay_payment_id: p.razorpay_payment_id,
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
      console.log('No payment records found - access denied');
      return { 
        success: false, 
        error: 'No payment records found for this email',
        debugInfo: { email, totalPayments: 0 }
      };
    }

    // STRICT: Only allow verified and completed payments
    const verifiedPayments = payments.filter(p => 
      p.status === 'completed' && 
      p.verified_at && 
      p.razorpay_payment_id
    );

    console.log('Verified payments after strict filtering:', {
      totalPayments: payments.length,
      verifiedPayments: verifiedPayments.length,
      verifiedIds: verifiedPayments.map(p => p.id)
    });

    if (verifiedPayments.length === 0) {
      // Check for stuck payments that can be auto-completed
      const pendingPayments = payments.filter(p => 
        p.status === 'pending' && 
        p.razorpay_payment_id
      );

      if (pendingPayments.length > 0) {
        console.log('Found pending payments with Razorpay IDs, attempting auto-completion');
        const autoCompletedPayments = await autoCompleteStuckPayments(pendingPayments);
        verifiedPayments.push(...autoCompletedPayments);
      }

      if (verifiedPayments.length === 0) {
        console.log('No verified payments found - access denied');
        return { 
          success: false, 
          error: 'No verified payments found. Payment verification required.',
          debugInfo: { 
            email,
            totalPayments: payments.length,
            pendingPayments: pendingPayments.length,
            suggestion: 'Complete payment verification through proper payment gateway'
          }
        };
      }
    }

    // Use the most recent verified payment
    const latestPayment = verifiedPayments[0];
    console.log('Using latest verified payment:', {
      id: latestPayment.id,
      amount: latestPayment.amount,
      verified_at: latestPayment.verified_at
    });

    // Grant access only for verified payments
    const accessResult = await grantProductAccess(userId, latestPayment);
    if (!accessResult.success) {
      return accessResult as PaymentVerificationResult;
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
        verifiedAt: latestPayment.verified_at,
        strictVerification: true
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
