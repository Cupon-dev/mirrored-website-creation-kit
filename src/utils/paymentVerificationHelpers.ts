
export const getEmailFromSources = (searchParams: URLSearchParams, userEmail?: string) => {
  // Get email from URL params or user
  let email = searchParams.get('email') || userEmail;
  
  if (!email) {
    // Try to get from localStorage
    const pendingPayment = localStorage.getItem('pending_payment');
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment);
        email = paymentData.email;
        console.log('Retrieved email from localStorage:', email);
      } catch (error) {
        console.error('Error parsing pending payment:', error);
      }
    }
  }
  
  return email;
};

export const getUrlParameters = (searchParams: URLSearchParams) => {
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  
  return {
    paymentId,
    status,
    allParams: Object.fromEntries(searchParams.entries())
  };
};

export const clearPendingPayment = () => {
  localStorage.removeItem('pending_payment');
};
