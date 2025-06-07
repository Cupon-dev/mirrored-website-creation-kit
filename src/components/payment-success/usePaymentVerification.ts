
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentData } from '@/hooks/usePaymentData';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';
import { usePaymentVerificationLogic } from '@/hooks/usePaymentVerificationLogic';
import { useManualRefresh } from '@/hooks/useManualRefresh';
import { getEmailFromSources, getUrlParameters } from '@/utils/paymentVerificationHelpers';

export const usePaymentVerification = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const {
    paymentData,
    setPaymentData,
    verificationComplete,
    setVerificationComplete,
  } = usePaymentData();

  const {
    isProcessing,
    setIsProcessing,
    showGenericSuccess,
    showPaymentReceived,
    showPaymentSuccess,
    showPaymentError,
    showAccessGranted,
    showStillProcessing,
    showVerificationError,
    showNoPaymentFound,
  } = usePaymentProcessing();

  const { processPaymentVerification } = usePaymentVerificationLogic({
    setPaymentData,
    setVerificationComplete,
    setIsProcessing,
    showPaymentSuccess,
    showPaymentReceived,
    showPaymentError,
  });

  const { handleManualRefresh } = useManualRefresh({
    setIsProcessing,
    showAccessGranted,
    showStillProcessing,
    showVerificationError,
    showNoPaymentFound,
  });

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      console.log('Payment success handler started');
      
      const userEmail = getEmailFromSources(searchParams, user?.email);
      const { paymentId, status, allParams } = getUrlParameters(searchParams);
      
      console.log('URL Parameters:', { 
        email: userEmail, 
        paymentId, 
        status,
        allParams
      });
      
      if (!userEmail) {
        showGenericSuccess();
        setIsProcessing(false);
        return;
      }

      await processPaymentVerification(userEmail, paymentId);
    };

    handlePaymentSuccess();
  }, [searchParams, user, processPaymentVerification, showGenericSuccess, setIsProcessing]);

  return {
    isProcessing,
    paymentData,
    verificationComplete,
    handleManualRefresh
  };
};
