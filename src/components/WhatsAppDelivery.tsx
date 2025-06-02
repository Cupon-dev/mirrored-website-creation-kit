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
  const { toast } = useToast();

  // Google Drive link for the digital product
  const driveLink = "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link";
  
  // WhatsApp group link
  const whatsappGroupLink = "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X";

  // Function to check payment status
  const checkPaymentStatus = async (userEmail?: string, userPhone?: string) => {
    try {
      const checkEmail = userEmail || email;
      const checkPhone = userPhone || phoneNumber;
      
      console.log('Checking payment status for:', { checkEmail, checkPhone });

      if (!checkEmail && !checkPhone) {
        console.log('No email or phone to check');
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

      if (error) {
        console.error('Error checking payment status:', error);
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
          description: "WhatsApp message sent! Redirecting to success page...",
          duration: 6000,
        });
        
        // Redirect to success page with payment details
        setTimeout(() => {
          const successUrl = `/payment-success?payment_id=${data.payment_id}&email=${checkEmail}&drive_link=${encodeURIComponent(data.drive_link || driveLink)}`;
          window.location.href = successUrl;
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
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
        checkPaymentStatus(paymentData.email, paymentData.phoneNumber);
        
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
        
        // Create a payment success redirect URL
        const successUrl = `${window.location.origin}/payment-success`;
        const razorpayUrl = `${razorpayProduct.products.razorpay_link}&redirect_url=${encodeURIComponent(successUrl)}`;
        
        toast({
          title: "Redirecting to Payment",
          description: "Complete your payment and you'll be redirected back automatically!",
          duration: 5000,
        });
        
        // Open payment link
        window.open(razorpayUrl, '_self'); // Use _self to redirect in same tab
        
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
    const isDirectMessage = paymentData?.delivery_method === 'twilio_whatsapp';
    
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border text-center">
        <div className="space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold text-green-600">Payment Successful! 🎉</h3>
          
          <div className="bg-blue-100 rounded-xl p-4 border border-blue-300">
            <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-blue-800 font-medium">
              {isDirectMessage ? "✅ WhatsApp message sent directly to your phone!" : "✅ WhatsApp link created for instant messaging!"}
            </p>
            <p className="text-blue-700 text-sm mt-1">
              {isDirectMessage ? "Check your WhatsApp for the download link and group invite." : "Click the WhatsApp button below to send yourself the download link instantly."}
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="space-y-2 text-sm text-left">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-500" />
                <span>Download access: {paymentData?.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-500" />
                <span>WhatsApp group invite included</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-purple-500" />
                <span>{isDirectMessage ? "Message delivered to WhatsApp" : "Instant WhatsApp delivery ready"}</span>
              </div>
            </div>
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

            {paymentData?.whatsapp_url && paymentData?.delivery_method !== 'twilio_whatsapp' && (
              <Button
                onClick={() => window.open(paymentData.whatsapp_url, '_blank')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-xl animate-pulse"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send WhatsApp Message Now! 🚀
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
              placeholder="7339525425"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-center text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Enter your 10-digit mobile number (without +91)</p>
          </div>

          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Direct WhatsApp message to your phone</span>
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
        <p className="text-gray-600">Pay securely - You'll be redirected back automatically!</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">WhatsApp:</span>
            <span className="font-medium">+91{phoneNumber}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>🚀 Automatic Process:</strong><br/>
            1. Click "Buy" below to complete payment<br/>
            2. After payment, you'll be redirected back automatically<br/>
            3. Your product access will be granted immediately<br/>
            4. WhatsApp message with download link will be sent
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
              Buy - ₹{cartTotal.toLocaleString('en-IN')}
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
          🔒 Secure payment • 🔄 Auto redirect after payment • 🎯 Instant access
        </p>
      </div>
    </div>
  );
};

export default WhatsAppDelivery;
