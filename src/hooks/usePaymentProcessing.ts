
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const usePaymentProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const showGenericSuccess = () => {
    console.log('No email found, showing generic success message');
    toast({
      title: "Payment Successful! 🎉",
      description: "Your payment was processed. Please login to access your content.",
      variant: "default",
    });
    
    // Redirect to home after showing message
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);
  };

  const showPaymentReceived = () => {
    toast({
      title: "Payment Received ✅",
      description: "Your payment was successful. Access will be granted shortly. Redirecting to home...",
      variant: "default",
      duration: 4000,
    });
    
    setTimeout(() => {
      console.log('Redirecting to home after incomplete verification');
      navigate('/', { replace: true });
    }, 4000);
  };

  const showPaymentSuccess = () => {
    toast({
      title: "Payment Successful! 🎉",
      description: "Your access has been granted instantly!",
      duration: 6000,
    });

    // Auto redirect after 5 seconds to give user time to see success
    setTimeout(() => {
      console.log('Auto-redirecting to home page');
      navigate('/', { replace: true });
    }, 5000);
  };

  const showPaymentError = () => {
    toast({
      title: "Payment Received ✅",
      description: "Your payment was successful. Please check back in a few minutes for access.",
      variant: "default",
      duration: 4000,
    });
    
    setTimeout(() => {
      console.log('Redirecting to home after error');
      navigate('/', { replace: true });
    }, 4000);
  };

  const showAccessGranted = () => {
    toast({
      title: "Access Granted! ✅",
      description: "Your purchase has been verified.",
    });
    
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 2000);
  };

  const showStillProcessing = () => {
    toast({
      title: "Still Processing",
      description: "Payment verification is still in progress. Please wait...",
    });
  };

  const showVerificationError = () => {
    toast({
      title: "Verification Error",
      description: "Unable to verify payment. Please contact support if this persists.",
      variant: "destructive",
    });
  };

  const showNoPaymentFound = () => {
    toast({
      title: "No Payment Found",
      description: "No payment information found. Redirecting to home...",
      variant: "destructive",
    });
    
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 2000);
  };

  return {
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
  };
};
