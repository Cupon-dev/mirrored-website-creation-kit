
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Download, ExternalLink, CreditCard, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppDeliveryProps {
  cartTotal: number;
  cartItems: any[];
  onOrderComplete: () => void;
}

const WhatsAppDelivery = ({ cartTotal, cartItems, onOrderComplete }: WhatsAppDeliveryProps) => {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [checkingAttempts, setCheckingAttempts] = useState(0);
  const { toast } = useToast();

  // Google Drive link for the digital product
  const driveLink = "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link";
  
  // WhatsApp group link
  const whatsappGroupLink = "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X";

  // Function to check payment status
  const checkPaymentStatus = async (userEmail?: string, userPhone?: string) => {
    try {
      setIsCheckingPayment(true);
      
      const checkEmail = userEmail || email;
      const checkPhone = userPhone || phoneNumber;
      
      console.log('Checking payment status for:', { checkEmail, checkPhone, attempt: checkingAttempts + 1 });

      if (!checkEmail && !checkPhone) {
        console.log('No email or phone to check');
        setIsCheckingPayment(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: checkEmail,
          phone: checkPhone
        })
      });

      console.log('Payment status response:', data, error);
      setCheckingAttempts(prev => prev + 1);

      if (error) {
        console.error('Error checking payment status:', error);
        setIsCheckingPayment(false);
        return;
      }

      if (data?.status === 'completed') {
        console.log('Payment confirmed! Processing delivery...');
        setPaymentData(data);
        setStep('success');
        
        // Clear pending payment from localStorage
        localStorage.removeItem('pending_payment');
        
        // Show success message
        toast({
          title: "Payment Successful! 🎉",
          description: "Your download link is ready! Check WhatsApp for instant delivery.",
          duration: 6000,
        });
        
        // Auto-open WhatsApp if we have a phone number
        if (data.phone && data.whatsapp_url) {
          console.log('Opening WhatsApp automatically...');
          setTimeout(() => {
            window.open(data.whatsapp_url, '_blank');
          }, 2000);
        } else if (data.phone) {
          // Fallback: create manual WhatsApp link
          const message = `🎉 Payment Confirmed! 

Download Link: ${data.drive_link}
WhatsApp Group: ${data.whatsapp_group}

Payment ID: ${data.payment_id}`;
          
          const cleanPhone = data.phone.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          
          setTimeout(() => {
            window.open(whatsappUrl, '_blank');
          }, 2000);
        }
      }
      
      setIsCheckingPayment(false);
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      setIsCheckingPayment(false);
      setCheckingAttempts(prev => prev + 1);
    }
  };

  // Check for pending payment on component mount
  useEffect(() => {
    const pendingPayment = localStorage.getItem('pending_payment');
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment);
        setEmail(paymentData.email);
        setPhoneNumber(paymentData.phoneNumber);
        setPaymentId(paymentData.paymentId);
        
        console.log('Found pending payment:', paymentData);
        
        // Start checking payment status every 2 seconds
        const interval = setInterval(() => {
          checkPaymentStatus(paymentData.email, paymentData.phoneNumber);
        }, 2000);
        
        // Clear interval after 10 minutes
        setTimeout(() => {
          clearInterval(interval);
          localStorage.removeItem('pending_payment');
          console.log('Payment checking timeout reached');
        }, 600000);
        
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error parsing pending payment:', error);
        localStorage.removeItem('pending_payment');
      }
    }
  }, []);

  const handleDetailsSubmit = () => {
    if (!email || !phoneNumber) {
      toast({
        title: "Details required",
        description: "Please enter both email and WhatsApp number to proceed.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setStep("payment");
  };

  const initiateRazorpayPayment = async () => {
    try {
      setIsProcessing(true);

      // Generate a unique order ID for Razorpay
      const orderIdSuffix = Math.random().toString(36).substring(2, 8);
      const razorpayOrderId = `order_${Date.now()}_${orderIdSuffix}`;

      console.log('Creating payment record with order ID:', razorpayOrderId);

      // Create payment record first with razorpay_order_id
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          email: email,
          mobile_number: phoneNumber,
          amount: cartTotal,
          google_drive_link: driveLink,
          razorpay_order_id: razorpayOrderId,
          status: 'pending'
        }])
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }

      console.log('Payment record created:', payment);
      setPaymentId(payment.id);

      // Check if any cart item has a razorpay_link
      const razorpayProduct = cartItems.find(item => item.products?.razorpay_link);
      
      if (razorpayProduct?.products?.razorpay_link) {
        console.log('Opening Razorpay link:', razorpayProduct.products.razorpay_link);
        
        // Store payment details in localStorage for recovery
        localStorage.setItem('pending_payment', JSON.stringify({
          paymentId: payment.id,
          email,
          phoneNumber,
          cartTotal,
          driveLink,
          razorpayOrderId
        }));
        
        toast({
          title: "Redirecting to Payment",
          description: "After payment, your download link will be sent automatically via WhatsApp!",
          duration: 5000,
        });
        
        // Open payment link
        window.open(razorpayProduct.products.razorpay_link, '_blank');
        
        // Start checking payment status immediately
        setTimeout(() => {
          setCheckingAttempts(0);
          const interval = setInterval(() => {
            checkPaymentStatus();
          }, 3000);
          
          // Clear interval after 10 minutes
          setTimeout(() => {
            clearInterval(interval);
          }, 600000);
        }, 5000); // Start checking after 5 seconds
        
      } else {
        throw new Error("No payment link found for this product");
      }
      
      setIsProcessing(false);
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Payment initiation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (step === "success") {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border text-center">
        <div className="space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold text-green-600">Payment Successful! 🎉</h3>
          <p className="text-gray-600">
            Your download link has been processed automatically!
          </p>
          
          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">Delivery Completed</span>
            </div>
            
            {paymentData && (
              <div className="space-y-2 text-sm text-left">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>Download access: {paymentData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span>WhatsApp group invite sent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  <span>Delivery: {paymentData.delivery_method || 'automatic'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.open(paymentData?.drive_link || driveLink, '_blank')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 text-lg rounded-xl"
            >
              <Download className="w-5 h-5 mr-2" />
              Open Download Link
            </Button>

            <Button
              onClick={() => window.open(paymentData?.whatsapp_group || whatsappGroupLink, '_blank')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg rounded-xl"
            >
              <Users className="w-5 h-5 mr-2" />
              Join WhatsApp Group
            </Button>

            {paymentData?.whatsapp_url && (
              <Button
                onClick={() => window.open(paymentData.whatsapp_url, '_blank')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-xl"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Open WhatsApp Message
              </Button>
            )}

            <Button
              onClick={onOrderComplete}
              variant="outline"
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">🚀 Complete Your Order</h3>
          <p className="text-gray-600">Enter your details for automatic WhatsApp delivery!</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address (for Google Drive access)
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-center text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">This email will get access to the Google Drive content</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number (for delivery)
            </label>
            <Input
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-center text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
          </div>

          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">${cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Automatic WhatsApp delivery</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Community access included</span>
              </div>

              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">Google Drive access for your email only</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleDetailsSubmit}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Proceed to Payment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">💳 Complete Payment</h3>
        <p className="text-gray-600">Pay securely - Download link will be sent automatically to WhatsApp!</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">WhatsApp:</span>
            <span className="font-medium">{phoneNumber}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        {isCheckingPayment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Checking payment status...</strong><br/>
              Attempt {checkingAttempts} - We're automatically detecting your payment completion.
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>🚀 Automatic Process:</strong><br/>
            1. Click "Pay with Razorpay" below<br/>
            2. Complete payment securely<br/>
            3. <strong>Download link will be sent automatically to your WhatsApp!</strong><br/>
            4. You'll also receive our WhatsApp group invite<br/>
            5. Google Drive access will be restricted to your email only
          </p>
        </div>

        <Button
          onClick={initiateRazorpayPayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Opening Payment Gateway...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay with Razorpay - Auto Delivery
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setStep("details")}
          className="w-full"
        >
          Back to Edit Details
        </Button>

        <p className="text-xs text-center text-gray-500">
          🔒 Secure payment • 📱 Automatic WhatsApp delivery • 🎯 Restricted Google Drive access
        </p>
      </div>
    </div>
  );
};

export default WhatsAppDelivery;
