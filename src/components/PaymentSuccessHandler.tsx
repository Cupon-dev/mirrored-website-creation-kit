
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ExternalLink, Home, Download, Users } from 'lucide-react';
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
      const email = searchParams.get('email') || user?.email;
      
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
        
        // Verify payment and grant access
        const result = await verifyPaymentAndGrantAccess(email, user?.id);
        
        if (result.success && result.accessGranted) {
          setPaymentData({
            email: email,
            drive_link: result.driveLink,
            whatsapp_group: result.whatsappGroup
          });

          // Grant access locally
          if (user) {
            await grantAccess('digital-product-1');
          }

          toast({
            title: "Payment Successful! 🎉",
            description: "Your product access has been granted instantly!",
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
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        toast({
          title: "Payment Received",
          description: "Your payment was successful. Access will be granted shortly.",
          variant: "default",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, user, grantAccess, toast, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700">Verifying payment and granting access...</p>
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
          Your purchase has been completed and access has been granted instantly!
        </p>

        {paymentData && (
          <div className="space-y-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-green-800 mb-2">✅ Instant Access Granted!</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Product access activated</li>
                <li>✅ Download link ready</li>
                <li>✅ WhatsApp community access</li>
                <li>✅ Available on home page now</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => window.open(paymentData.drive_link, '_blank')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Access Your Product Now
              </Button>

              <Button
                onClick={() => window.open(paymentData.whatsapp_group, '_blank')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl"
              >
                <Users className="w-5 h-5 mr-2" />
                Join WhatsApp Community
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Redirecting to home page in 3 seconds...</p>
              <Button
                onClick={() => navigate('/', { replace: true })}
                variant="outline"
                className="w-full border-2 border-green-400 text-green-700 hover:bg-green-50 font-semibold py-3 rounded-xl"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Home Now
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500">
          💡 Your purchased products now show "Access Your Product" button on the home page!
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessHandler;
