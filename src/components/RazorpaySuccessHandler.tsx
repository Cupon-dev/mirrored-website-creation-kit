import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { recordPayment } from '@/services/paymentService';
import { CheckCircle, AlertCircle, RefreshCw, Home } from 'lucide-react';

const RazorpaySuccessHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    paymentId?: string;
  } | null>(null);

  useEffect(() => {
    handleRazorpayReturn();
  }, [user]);

  const handleRazorpayReturn = async () => {
    try {
      console.log('🔍 Processing Razorpay return...');
      
      // Get payment details from URL parameters
      const razorpayPaymentId = searchParams.get('payment_id') || 
                               searchParams.get('razorpay_payment_id') ||
                               extractPaymentIdFromUrl();
      
      // Get stored payment info
      const pendingPayment = localStorage.getItem('pending_payment');
      
      if (!pendingPayment) {
        throw new Error('No pending payment information found. Please contact support.');
      }

      const paymentInfo = JSON.parse(pendingPayment);
      console.log('📋 Payment info:', paymentInfo);
      console.log('💳 Razorpay Payment ID:', razorpayPaymentId);

      if (!user?.email) {
        throw new Error('Please login to complete payment verification');
      }

      if (!razorpayPaymentId) {
        throw new Error('Payment ID not found. Please contact support with your payment reference.');
      }

      // Record the payment with Razorpay ID
      const result = await recordPayment(
        user.email,
        paymentInfo.productId,
        paymentInfo.amount,
        'razorpay',
        {
          razorpayPaymentId: razorpayPaymentId
        }
      );

      if (result.success) {
        setResult({
          success: true,
          message: result.accessGranted 
            ? 'Payment verified! Access granted immediately.' 
            : 'Payment recorded! Access will be granted within minutes.',
          paymentId: result.paymentId
        });

        // Clear pending payment
        localStorage.removeItem('pending_payment');

        toast({
          title: "Payment Successful! 🎉",
          description: result.message,
          duration: 6000,
        });

        // Auto-redirect after 5 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);

      } else {
        throw new Error(result.error || 'Failed to process payment');
      }

    } catch (error: any) {
      console.error('❌ Razorpay processing error:', error);
      
      setResult({
        success: false,
        message: error.message
      });

      toast({
        title: "Payment Processing Issue",
        description: error.message,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const extractPaymentIdFromUrl = () => {
    // Extract payment ID from various possible URL formats
    const url = window.location.href;
    const patterns = [
      /payment_id=([^&]+)/,
      /razorpay_payment_id=([^&]+)/,
      /pay_[A-Za-z0-9]+/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    return null;
  };

  const manualVerification = async () => {
    try {
      const paymentId = prompt('Please enter your Razorpay Payment ID (starts with pay_):');
      if (!paymentId) return;

      setIsProcessing(true);
      
      const pendingPayment = localStorage.getItem('pending_payment');
      if (!pendingPayment || !user?.email) {
        throw new Error('Missing payment information');
      }

      const paymentInfo = JSON.parse(pendingPayment);
      
      const result = await recordPayment(
        user.email,
        paymentInfo.productId,
        paymentInfo.amount,
        'razorpay',
        {
          razorpayPaymentId: paymentId
        }
      );

      if (result.success) {
        setResult({
          success: true,
          message: 'Payment verified manually! Access granted.',
          paymentId: result.paymentId
        });

        localStorage.removeItem('pending_payment');
        
        toast({
          title: "Payment Verified! ✅",
          description: "Access granted successfully",
          duration: 4000,
        });

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);

      } else {
        throw new Error(result.error || 'Manual verification failed');
      }

    } catch (error: any) {
      toast({
        title: "Manual Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-bold mb-2">Processing Payment...</h2>
            <p className="text-gray-600">
              Verifying your Razorpay payment and granting access
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {result?.success ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <CardTitle className={`text-xl ${result?.success ? 'text-green-800' : 'text-red-800'}`}>
            {result?.success ? 'Payment Successful!' : 'Payment Issue'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-gray-700">
            {result?.message}
          </p>

          {result?.paymentId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Payment ID:</strong> {result.paymentId}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home Page
            </Button>

            {!result?.success && (
              <Button
                onClick={manualVerification}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                Manual Verification
              </Button>
            )}
          </div>

          {!result?.success && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Need Help?</strong> Contact support with payment ID: <strong>pay_QkIJeiMIgvlEAQ</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RazorpaySuccessHandler;
