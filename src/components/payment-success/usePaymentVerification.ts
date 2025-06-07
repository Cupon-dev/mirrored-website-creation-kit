
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
  const { grantAccess, refreshAccess } = useUserAccess();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      console.log('Payment success handler started');
      
      // Get email from URL params or user
      let userEmail = searchParams.get('email') || user?.email;
      
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
      
      if (!userEmail) {
        toast({
          title: "Error",
          description: "No email found for payment verification",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      try {
        console.log('Processing payment success for email:', userEmail);
        
        // Add delay to allow webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify payment and grant access
        const result = await verifyPaymentAndGrantAccess(userEmail, user?.id);
        
        if (result.success && result.accessGranted) {
          setPaymentData({
            email: userEmail,
            driveLink: result.driveLink,
            whatsappGroup: result.whatsappGroup
          });

          // Grant access locally if user is logged in
          if (user) {
            await grantAccess('digital-product-1');
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

          // Auto redirect after 5 seconds
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 5000);
        } else {
          // Payment still processing
          toast({
            title: "Payment Processing",
            description: "Your payment was successful. Access will be granted shortly.",
            variant: "default",
          });
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        toast({
          title: "Payment Received",
          description: "Your payment was successful. Please check back in a few minutes for access.",
          variant: "default",
        });
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, user, grantAccess, refreshAccess, toast, navigate]);

  const handleManualRefresh = async () => {
    setIsProcessing(true);
    if (user?.email) {
      const result = await verifyPaymentAndGrantAccess(user.email, user.id);
      if (result.success) {
        await refreshAccess();
        toast({
          title: "Access Granted!",
          description: "Your purchase has been verified.",
        });
        navigate('/', { replace: true });
      }
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
