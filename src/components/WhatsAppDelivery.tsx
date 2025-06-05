
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, CheckCircle, Loader2, User, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { initializePayment } from "@/services/paymentService";

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

    // Validate phone number (basic check)
    if (phoneNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number.",
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

      const userEmail = user?.email || email;
      const userPhone = user?.mobile_number || phoneNumber;

      // Initialize payment record
      const paymentResult = await initializePayment(userEmail, userPhone, cartTotal);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Failed to initialize payment");
      }

      // Store payment details for recovery
      localStorage.setItem('pending_payment', JSON.stringify({
        paymentId: paymentResult.paymentId,
        email: userEmail,
        phoneNumber: userPhone,
        cartTotal,
        razorpayOrderId: paymentResult.razorpayOrderId
      }));

      // Check if any cart item has a razorpay_link
      const razorpayProduct = cartItems.find(item => item.products?.razorpay_link);
      
      if (razorpayProduct?.products?.razorpay_link) {
        const successUrl = `${window.location.origin}/payment-success?email=${encodeURIComponent(userEmail)}`;
        const cancelUrl = `${window.location.origin}/cart`;
        
        // Add success and cancel URLs to the Razorpay link
        const razorpayUrl = new URL(razorpayProduct.products.razorpay_link);
        razorpayUrl.searchParams.set('prefill[email]', userEmail);
        razorpayUrl.searchParams.set('prefill[contact]', userPhone);
        razorpayUrl.searchParams.set('notes[order_id]', paymentResult.razorpayOrderId);
        
        toast({
          title: "Opening Payment Gateway",
          description: "Complete your payment to get instant access!",
          duration: 5000,
        });
        
        // Open payment link in same tab for better mobile experience
        window.location.href = razorpayUrl.toString();
        
      } else {
        throw new Error("Payment gateway not configured for this product");
      }
      
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to start payment process",
        variant: "destructive"
      });
    }
  };

  if (step === "success") {
    return (
      <div className="space-y-4 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border text-center max-w-md mx-auto">
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
    );
  }

  if (step === "details" && !user) {
    return (
      <div className="space-y-4 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border max-w-md mx-auto">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Complete Your Order</h3>
          <p className="text-sm sm:text-base text-gray-600">Enter your details to create account and proceed</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600">Total Amount:</span>
              <span className="text-lg sm:text-2xl font-bold text-green-600">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Instant access after payment</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Permanent access to content</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleDetailsSubmit}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 sm:py-4 text-sm sm:text-lg rounded-xl shadow-lg"
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
    <div className="space-y-4 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border max-w-md mx-auto">
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">💳 Complete Payment</h3>
        <p className="text-sm sm:text-base text-gray-600">Secure payment gateway</p>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-xl p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium">{user?.name || name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium break-all">{user?.email || email}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm sm:text-base text-gray-600">Total Amount:</span>
            <span className="text-lg sm:text-2xl font-bold text-green-600">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-green-800">
            <strong>🚀 Simple Process:</strong><br/>
            1. Click "Pay Now" to open secure payment gateway<br/>
            2. Complete payment using any method<br/>
            3. Access granted immediately after payment<br/>
            4. Return to home page to access your content
          </p>
        </div>

        <Button
          onClick={initiatePayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 text-sm sm:text-lg rounded-xl shadow-lg"
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
          🔒 Secure payment • ⚡ Instant access • 📱 Mobile optimized
        </p>
      </div>
    </div>
  );
};

export default WhatsAppDelivery;
