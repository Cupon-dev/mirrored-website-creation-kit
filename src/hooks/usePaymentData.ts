
import { useState } from 'react';

export interface PaymentData {
  email: string;
  driveLink?: string;
  whatsappGroup?: string;
}

export const usePaymentData = () => {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);

  return {
    paymentData,
    setPaymentData,
    verificationComplete,
    setVerificationComplete,
  };
};
