
import { verifyPaymentAndGrantAccess } from '@/services/paymentService';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccess } from '@/hooks/useUserAccess';

interface UseManualRefreshProps {
  setIsProcessing: (processing: boolean) => void;
  showAccessGranted: () => void;
  showStillProcessing: () => void;
  showVerificationError: () => void;
  showNoPaymentFound: () => void;
}

export const useManualRefresh = ({
  setIsProcessing,
  showAccessGranted,
  showStillProcessing,
  showVerificationError,
  showNoPaymentFound,
}: UseManualRefreshProps) => {
  const { user } = useAuth();
  const { refreshAccess } = useUserAccess();

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
        
        if (result.success && result.accessGranted) {
          await refreshAccess();
          showAccessGranted();
        } else {
          showStillProcessing();
        }
      } catch (error) {
        console.error('Manual refresh error:', error);
        showVerificationError();
      }
    } else {
      showNoPaymentFound();
    }
    
    setIsProcessing(false);
  };

  return {
    handleManualRefresh,
  };
};
