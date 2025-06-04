
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccess } from '@/hooks/useUserAccess';
import { verifyPaymentAndGrantAccess } from '@/services/paymentService';

const PaymentSuccessHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { grantAccess } = useUserAccess();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      // Get email from URL params or user
      const email = searchParams.get('email') || user?.email;
      
      if (!email) {
        // Try to get from localStorage
        const pendingPayment = localStorage.getItem('pending_payment');
        if (pendingPayment) {
          try {
            const paymentData = JSON.parse(pendingPayment);
            email = paymentData.email;
          } catch (error) {
            console.error('Error parsing pending payment:', error);
          }
        }
      }
      
      if (!email) {
        toast({
          title: "Error",
          description: "No email found for payment verification",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      try {
        console.log('Processing payment success for email:', email);
        
        // Add a small delay to allow webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify payment and grant access
        const result = await verifyPaymentAndGrantAccess(email, user?.id);
        
        if (result.success && result.accessGranted) {
          setPaymentData({
            email: email
          });

          // Grant access locally
          if (user) {
            await grantAccess('digital-product-1');
          }

          // Clear pending payment
          localStorage.removeItem('pending_payment');

          toast({
            title: "Payment Successful! 🎉",
            description: "Your access has been granted instantly!",
            duration: 6000,
          });

          // Auto redirect after 3 seconds
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        } else {
          toast({
            title: "Payment Processing",
            description: result.error || "Payment verification in progress...",
            variant: "default",
          });
          
          // Redirect to home anyway after a delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 5000);
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        toast({
          title: "Payment Received",
          description: "Your payment was successful. Access will be granted shortly.",
          variant: "default",
        });
        
        // Redirect to home
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, user, grantAccess, toast, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 text-lg font-medium">Verifying payment...</p>
          <p className="text-gray-600 text-sm mt-2">Please wait while we process your payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your purchase has been completed successfully!
        </p>

        <div className="space-y-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-green-800 mb-2">✅ Access Granted!</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ Product access activated</li>
              <li>✅ Available on home page now</li>
              <li>✅ Permanent access to content</li>
              <li>✅ No additional steps needed</li>
            </ul>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Redirecting to home page in 3 seconds...</p>
            <Button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Home Now
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          💡 Your purchased products now show "Access Your Content" button on the home page!
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessHandler;
