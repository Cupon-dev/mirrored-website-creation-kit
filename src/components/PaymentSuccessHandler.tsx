
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, Play, ExternalLink } from 'lucide-react';
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
        
        // Add a delay to allow webhook processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
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
          }

          // Clear pending payment
          localStorage.removeItem('pending_payment');

          toast({
            title: "Payment Successful! 🎉",
            description: "Your access has been granted instantly!",
            duration: 6000,
          });

          // Auto redirect after 8 seconds
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 8000);
        } else {
          // Payment processing - still redirect but with different message
          toast({
            title: "Payment Processing",
            description: "Your payment was successful. Access will be granted shortly.",
            variant: "default",
          });
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 6000);
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
        }, 5000);
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

          {/* Video Demo Section */}
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <Play className="w-4 h-4 mr-2" />
              📹 Watch Demo Video
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              See how to access and use your purchased content with this quick demo video.
            </p>
            <Button
              onClick={() => window.open('https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view', '_blank')}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Demo Video
            </Button>
          </div>

          {/* Access Links */}
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
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Redirecting to home page in 8 seconds...</p>
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
