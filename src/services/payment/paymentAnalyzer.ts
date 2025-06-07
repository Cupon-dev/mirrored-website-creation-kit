
export const analyzePayments = (payments: any[]) => {
  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const failedPayments = payments.filter(p => p.status === 'failed');
  const paymentsWithRazorpayId = payments.filter(p => p.razorpay_payment_id);

  return {
    completedPayments,
    pendingPayments,
    failedPayments,
    paymentsWithRazorpayId,
    stats: {
      total: payments.length,
      completed: completedPayments.length,
      pending: pendingPayments.length,
      failed: failedPayments.length,
      withRazorpayId: paymentsWithRazorpayId.length
    }
  };
};

export const generateErrorMessage = (
  completedPayments: any[],
  pendingPayments: any[],
  failedPayments: any[]
) => {
  if (completedPayments.length > 0) {
    return null; // No error
  }

  let errorMessage = 'No completed payments found.';
  let suggestion = '';

  if (pendingPayments.length > 0) {
    errorMessage = 'Payment found but still processing.';
    suggestion = 'Your payment is being processed. Please wait and try again.';
  } else if (failedPayments.length > 0) {
    errorMessage = 'Payment failed. Please try again.';
    suggestion = 'Previous payment attempts failed. Please make a new payment.';
  }

  return { errorMessage, suggestion };
};
