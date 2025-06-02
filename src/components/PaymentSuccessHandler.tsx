
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ExternalLink, Home, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccess } from '@/hooks/useUserAccess';

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
      const paymentId = searchParams.get('payment_id');
      const razorpayPaymentId = searchParams.get('razorpay_payment_id');
      const email = searchParams.get('email');
      const driveLink = searchParams.get('drive_link');

      console.log('Payment success params:', { paymentId, razorpayPaymentId, email, driveLink });

      if (paymentId || razorpayPaymentId || email) {
        try {
          // Set up payment data
          const mockPaymentData = {
            payment_id: paymentId || razorpayPaymentId,
            email: email || user?.email,
            drive_link: driveLink || "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link",
            whatsapp_group: "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X"
          };

          setPaymentData(mockPaymentData);
          
          // Grant access to the product
          if (user) {
            grantAccess('digital-product-1'); // Grant access to default product
            console.log('Access granted to user:', user.id);
          }

          toast({
            title: "Payment Successful! 🎉",
            description: "Your product is now accessible. You can now access your download link!",
            duration: 6000,
          });

          setIsProcessing(false);
        } catch (error) {
          console.error('Error processing payment success:', error);
          toast({
            title: "Payment Processed",
            description: "Your payment was successful. You should receive access shortly.",
            variant: "default",
          });
          setIsProcessing(false);
        }
      } else {
        // Check if there's a pending payment in localStorage
        const pendingPayment = localStorage.getItem('pending_payment');
        if (pendingPayment) {
          try {
            const paymentInfo = JSON.parse(pendingPayment);
            const mockPaymentData = {
              payment_id: paymentInfo.paymentId,
              email: paymentInfo.email,
              drive_link: paymentInfo.driveLink,
              whatsapp_group: "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X"
            };

            setPaymentData(mockPaymentData);
            
            if (user) {
              grantAccess('digital-product-1');
            }

            // Clear the pending payment
            localStorage.removeItem('pending_payment');

            toast({
              title: "Payment Successful! 🎉",
              description: "Your product is now accessible!",
              duration: 6000,
            });
          } catch (error) {
            console.error('Error parsing pending payment:', error);
          }
        }
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, user, grantAccess, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700">Processing your payment...</p>
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
          Your purchase has been completed successfully. You now have access to your digital product.
        </p>

        {paymentData && (
          <div className="space-y-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Product access has been granted</li>
                <li>✅ Download link is now available</li>
                <li>✅ WhatsApp group invite included</li>
                <li>✅ You can access your product anytime from the main page</li>
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
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full border-2 border-green-400 text-green-700 hover:bg-green-50 font-semibold py-3 rounded-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Store
          </Button>
          
          <p className="text-xs text-gray-500">
            💡 You can access your purchased products anytime from the main page. Look for the "Access Your Product" button on items you've bought!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessHandler;
