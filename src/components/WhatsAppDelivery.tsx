
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, CheckCircle, AlertCircle, Loader2, User, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WhatsAppDeliveryProps {
  cartTotal: number;
  cartItems: any[];
  onOrderComplete: () => void;
}

const WhatsAppDelivery = ({ cartTotal, cartItems, onOrderComplete }: WhatsAppDeliveryProps) => {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();
  const { user, registerUser, loginUser } = useAuth();

  // If user is already logged in, skip to payment
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setPhoneNumber(user.mobile_number);
      setName(user.name);
      setStep("payment");
    }
  }, [user]);

  // Check for payment completion
  const checkPaymentStatus = async () => {
    try {
      const checkEmail = user?.email || email;
      
      if (!checkEmail) return;

      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: checkEmail })
      });

      if (error) {
        console.error('Error checking payment status:', error);
        return;
      }

      if (data?.status === 'completed') {
        console.log('Payment confirmed! Access granted.');
        setPaymentData(data);
        setStep('success');
        
        localStorage.removeItem('pending_payment');
        
        toast({
          title: "Payment Successful! 🎉",
          description: "Your access has been granted instantly!",
          duration: 6000,
        });
        
        // Redirect to home after success
        setTimeout(() => {
          onOrderComplete();
          window.location.href = '/';
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
    }
  };

  // Check for pending payment on mount
  useEffect(() => {
    const pendingPayment = localStorage.getItem('pending_payment');
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment);
        setEmail(paymentData.email);
        setPhoneNumber(paymentData.phoneNumber);
        checkPaymentStatus();
      } catch (error) {
        console.error('Error parsing pending payment:', error);
        localStorage.removeItem('pending_payment');
      }
    }
  }, []);

  const handleDetailsSubmit = async () => {
    if (!email || !phoneNumber || !name) {
      toast({
        title: "Details required",
        description: "Please enter all required details to proceed.",
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

    setIsProcessing(true);

    try {
      // Try to login first (returning user)
      const loginResult = await loginUser(email);
      
      if (loginResult.success) {
        toast({
          title: "Welcome back!",
          description: "Redirecting to payment...",
        });
        setStep("payment");
      } else {
        // Register new user
        const registerResult = await registerUser(name, email, phoneNumber);
        
        if (registerResult.success) {
          toast({
            title: "Account created!",
            description: "Proceeding to payment...",
          });
          setStep("payment");
        } else {
          toast({
            title: "Error",
            description: "Failed to create account. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error during registration/login:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const initiatePayment = async () => {
    try {
      setIsProcessing(true);

      const orderIdSuffix = Math.random().toString(36).substring(2, 8);
      const razorpayOrderId = `order_${Date.now()}_${orderIdSuffix}`;

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          email: user?.email || email,
          mobile_number: user?.mobile_number || phoneNumber,
          amount: cartTotal,
          google_drive_link: "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link",
          razorpay_order_id: razorpayOrderId,
          status: 'pending'
        }])
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }

      // Check if any cart item has a razorpay_link
      const razorpayProduct = cartItems.find(item => item.products?.razorpay_link);
      
      if (razorpayProduct?.products?.razorpay_link) {
        // Store payment details for recovery
        localStorage.setItem('pending_payment', JSON.stringify({
          paymentId: payment.id,
          email: user?.email || email,
          phoneNumber: user?.mobile_number || phoneNumber,
          cartTotal,
          razorpayOrderId
        }));
        
        const successUrl = `${window.location.origin}/payment-success`;
        const razorpayUrl = `${razorpayProduct.products.razorpay_link}&redirect_url=${encodeURIComponent(successUrl)}`;
        
        toast({
          title: "Redirecting to Payment",
          description: "Complete your payment and you'll be redirected back automatically!",
          duration: 5000,
        });
        
        // Open payment link
        window.open(razorpayUrl, '_self');
        
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
      <div className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border text-center max-w-md mx-auto">
        <div className="space-y-4">
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto" />
          <h3 className="text-lg sm:text-2xl font-bold text-green-600">Payment Successful! 🎉</h3>
          
          <div className="bg-green-100 rounded-xl p-3 sm:p-4 border border-green-300">
            <p className="text-green-800 font-medium text-sm sm:text-base">
              ✅ Your access has been granted instantly!
            </p>
            <p className="text-green-700 text-xs sm:text-sm mt-1">
              Return to home page to access your purchased content.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => {
                onOrderComplete();
                window.location.href = '/';
              }}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 text-sm sm:text-lg rounded-xl"
            >
              Go to Home Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "details" && !user) {
    return (
      <div className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border max-w-md mx-auto">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Complete Your Order</h3>
          <p className="text-sm sm:text-base text-gray-600">Enter your details to create your account and proceed</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Mobile Number
            </label>
            <Input
              type="tel"
              placeholder="7339525425"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-sm sm:text-base"
            />
            <p className="text-xs text-gray-500 mt-1">Enter your 10-digit mobile number (without +91)</p>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Total Amount:</span>
              <span className="text-lg sm:text-2xl font-bold text-green-600">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Instant access after payment</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Permanent access to your content</span>
              </div>

              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                <span className="text-gray-600">Your personal account created</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleDetailsSubmit}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 sm:py-4 text-sm sm:text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Create Account & Proceed
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border max-w-md mx-auto">
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">💳 Complete Payment</h3>
        <p className="text-sm sm:text-base text-gray-600">Pay securely - You'll be redirected back automatically!</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Customer:</span>
            <span className="font-medium text-sm">{user?.name || name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email:</span>
            <span className="font-medium text-sm break-all">{user?.email || email}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm sm:text-base text-gray-600">Total Amount:</span>
            <span className="text-lg sm:text-2xl font-bold text-green-600">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-green-800">
            <strong>🚀 Automatic Process:</strong><br/>
            1. Click "Pay Now" to complete payment<br/>
            2. After payment, you'll be redirected back automatically<br/>
            3. Your product access will be granted immediately<br/>
            4. Access your content from the home page
          </p>
        </div>

        <Button
          onClick={initiatePayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 text-sm sm:text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              Opening Payment Gateway...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Pay Now - ₹{cartTotal.toLocaleString('en-IN')}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => user ? setStep("payment") : setStep("details")}
          className="w-full"
          disabled={isProcessing}
        >
          Back
        </Button>

        <p className="text-xs text-center text-gray-500">
          🔒 Secure payment • 🔄 Auto redirect • 🎯 Instant access
        </p>
      </div>
    </div>
  );
};

export default WhatsAppDelivery;
