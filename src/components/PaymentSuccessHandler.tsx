
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, Play, ExternalLink, RefreshCw } from 'lucide-react';
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

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 text-lg font-medium">Verifying payment...</p>
          <p className="text-gray-600 text-sm mt-2">Please wait while we process your payment and grant access</p>
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
          {verificationComplete ? 'Your purchase has been completed and access granted!' : 'Your payment has been received and is being processed.'}
        </p>

        {verificationComplete && (
          <div className="space-y-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-green-800 mb-2">✅ Access Granted!</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Product access activated</li>
                <li>✅ Available on home page now</li>
                <li>✅ Permanent access to content</li>
              </ul>
            </div>

            {paymentData?.driveLink && (
              <div className="bg-purple-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-purple-800 mb-2">🔗 Your Content</h3>
                <Button
                  onClick={() => window.open(paymentData.driveLink, '_blank')}
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-100 mb-2"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Access Download Link
                </Button>
                {paymentData?.whatsappGroup && (
                  <Button
                    onClick={() => window.open(paymentData.whatsappGroup, '_blank')}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-100"
                  >
                    💬 Join WhatsApp Group
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/', { replace: true })}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Home Page
          </Button>
          
          {!verificationComplete && (
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              className="w-full"
              disabled={isProcessing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              Check Payment Status
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          💡 Your purchased products will show "Access Your Content" button on the home page!
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessHandler;
