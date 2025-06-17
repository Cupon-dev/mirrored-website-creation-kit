
import { getPaymentsByEmail } from './paymentQueries';
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

    if (!email || !userId) {
      console.log('Missing required parameters for verification');
      return { 
        success: false, 
        error: 'Invalid verification parameters - email and userId required',
        debugInfo: { email: !!email, userId: !!userId }
      };
    }

    // Get payments for this email
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
      console.log('No payment records found');
      return { 
        success: false, 
        error: 'No payment records found for this email',
        debugInfo: { email, totalPayments: 0 }
      };
    }

    // Accept completed payments with or without razorpay_payment_id for flexibility
    const validPayments = payments.filter(p => 
      p.status === 'completed' && (
        p.razorpay_payment_id || 
        p.verified_at
      )
    );

    console.log('Valid payments after filtering:', {
      totalPayments: payments.length,
      validPayments: validPayments.length,
      validIds: validPayments.map(p => p.id)
    });

    if (validPayments.length === 0) {
      // Check for stuck payments that can be auto-completed
      const pendingPayments = payments.filter(p => 
        p.status === 'pending' && 
        p.razorpay_payment_id
      );

      if (pendingPayments.length > 0) {
        console.log('Found pending payments with Razorpay IDs, attempting auto-completion');
        const autoCompletedPayments = await autoCompleteStuckPayments(pendingPayments);
        validPayments.push(...autoCompletedPayments);
      }

      if (validPayments.length === 0) {
        console.log('No valid payments found');
        return { 
          success: false, 
          error: 'No valid payments found. Please complete payment first.',
          debugInfo: { 
            email,
            totalPayments: payments.length,
            pendingPayments: pendingPayments.length,
            suggestion: 'Complete payment verification'
          }
        };
      }
    }

    // Use the most recent valid payment
    const latestPayment = validPayments[0];
    console.log('Using latest valid payment:', {
      id: latestPayment.id,
      amount: latestPayment.amount,
      verified_at: latestPayment.verified_at
    });

    // Grant access for valid payments
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
        verificationMode: 'production'
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
