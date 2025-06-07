
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccess } from '@/hooks/useUserAccess';
import { verifyPaymentAndGrantAccess } from '@/services/paymentService';

export const usePaymentVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshAccess } = useUserAccess();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      console.log('Payment success handler started');
      
      // Get email from URL params or user
      let userEmail = searchParams.get('email') || user?.email;
      const paymentId = searchParams.get('payment_id');
      const status = searchParams.get('status');
      
      console.log('URL Parameters:', { 
        email: userEmail, 
        paymentId, 
        status,
        allParams: Object.fromEntries(searchParams.entries())
      });
      
      if (!userEmail) {
        // Try to get from localStorage
        const pendingPayment = localStorage.getItem('pending_payment');
        if (pendingPayment) {
          try {
            const paymentData = JSON.parse(pendingPayment);
            userEmail = paymentData.email;
            console.log('Retrieved email from localStorage:', userEmail);
          } catch (error) {
            console.error('Error parsing pending payment:', error);
          }
        }
      }
      
      if (!userEmail) {
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
        
        setIsProcessing(false);
        return;
      }

      try {
        console.log('Processing payment success for email:', userEmail, 'Payment ID:', paymentId);
        
        // Add delay to allow webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify payment and grant access
        const result = await verifyPaymentAndGrantAccess(userEmail, user?.id);
        
        console.log('Payment verification result:', result);
        
        if (result.success && result.accessGranted) {
          setPaymentData({
            email: userEmail,
            driveLink: result.driveLink,
            whatsappGroup: result.whatsappGroup
          });

          // Refresh access to get the latest product access
          if (user) {
            await refreshAccess();
          }

          // Clear pending payment
          localStorage.removeItem('pending_payment');

          toast({
            title: "Payment Successful! 🎉",
            description: "Your access has been granted instantly!",
            duration: 6000,
          });

          setVerificationComplete(true);

          // Auto redirect after 5 seconds to give user time to see success
          setTimeout(() => {
            console.log('Auto-redirecting to home page');
            navigate('/', { replace: true });
          }, 5000);
        } else {
          // Payment still processing or failed
          console.log('Payment verification incomplete:', result);
          
          toast({
            title: "Payment Received ✅",
            description: "Your payment was successful. Access will be granted shortly. Redirecting to home...",
            variant: "default",
            duration: 4000,
          });
          
          // Clear pending payment anyway
          localStorage.removeItem('pending_payment');
          
          setTimeout(() => {
            console.log('Redirecting to home after incomplete verification');
            navigate('/', { replace: true });
          }, 4000);
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        
        toast({
          title: "Payment Received ✅",
          description: "Your payment was successful. Please check back in a few minutes for access.",
          variant: "default",
          duration: 4000,
        });
        
        // Clear pending payment
        localStorage.removeItem('pending_payment');
        
        setTimeout(() => {
          console.log('Redirecting to home after error');
          navigate('/', { replace: true });
        }, 4000);
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, user, refreshAccess, toast, navigate]);

  const handleManualRefresh = async () => {
    setIsProcessing(true);
    
    let userEmail = user?.email;
    if (!userEmail) {
      // Try to get from localStorage
      const pendingPayment = localStorage.getItem('pending_payment');
      if (pendingPayment) {
        try {
          const paymentData = JSON.parse(pendingPayment);
          userEmail = paymentData.email;
        } catch (error) {
          console.error('Error parsing pending payment:', error);
        }
      }
    }
    
    if (userEmail) {
      try {
        const result = await verifyPaymentAndGrantAccess(userEmail, user?.id);
        
        if (result.success) {
          await refreshAccess();
          
          toast({
            title: "Access Granted! ✅",
            description: "Your purchase has been verified.",
          });
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          toast({
            title: "Still Processing",
            description: "Payment verification is still in progress. Please wait...",
          });
        }
      } catch (error) {
        console.error('Manual refresh error:', error);
        
        toast({
          title: "Verification Error",
          description: "Unable to verify payment. Please contact support if this persists.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Payment Found",
        description: "No payment information found. Redirecting to home...",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    }
    
    setIsProcessing(false);
  };

  return {
    isProcessing,
    paymentData,
    verificationComplete,
    handleManualRefresh
  };
};
