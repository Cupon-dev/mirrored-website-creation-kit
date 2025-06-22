
import { verifyPaymentAndGrantAccess } from '@/services/payment/paymentVerification';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccess } from '@/hooks/useUserAccess';
import { clearPendingPayment } from '@/utils/paymentVerificationHelpers';
import type { PaymentData } from './usePaymentData';

interface UsePaymentVerificationLogicProps {
  setPaymentData: (data: PaymentData | null) => void;
  setVerificationComplete: (complete: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  showPaymentSuccess: () => void;
  showPaymentReceived: () => void;
  showPaymentError: () => void;
}

export const usePaymentVerificationLogic = ({
  setPaymentData,
  setVerificationComplete,
  setIsProcessing,
  showPaymentSuccess,
  showPaymentReceived,
  showPaymentError,
}: UsePaymentVerificationLogicProps) => {
  const { user } = useAuth();
  const { refreshAccess } = useUserAccess();

  const processPaymentVerification = async (userEmail: string, paymentId?: string) => {
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
          driveLink: result.driveLink || '',
          whatsappGroup: result.whatsappGroup || "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X"
        });

        // Refresh access to get the latest product access
        if (user) {
          await refreshAccess();
        }

        // Clear pending payment
        clearPendingPayment();

        showPaymentSuccess();
        setVerificationComplete(true);
      } else {
        // Payment still processing or failed
        console.log('Payment verification incomplete:', result);
        
        showPaymentReceived();
        
        // Clear pending payment anyway
        clearPendingPayment();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      
      showPaymentError();
      
      // Clear pending payment
      clearPendingPayment();
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPaymentVerification,
  };
};
