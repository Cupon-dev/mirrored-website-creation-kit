
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Download, ExternalLink, CreditCard, Users, CheckCircle, AlertCircle } from "lucide-react";
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
  const { toast } = useToast();

  // Google Drive link for the digital product
  const driveLink = "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link";
  
  // WhatsApp group link - REPLACE WITH YOUR ACTUAL GROUP LINK
  const whatsappGroupLink = "https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X";

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

      if (paymentError) throw paymentError;

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
          description: "After payment, you'll receive the download link automatically on WhatsApp! No need to return to this page.",
          duration: 5000,
        });
        
        // Open payment link
        window.open(razorpayProduct.products.razorpay_link, '_blank');
        
        // Show success message immediately
        setTimeout(() => {
          setStep("success");
        }, 2000);
        
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

  // Check for pending payment on component mount
  useState(() => {
    const pendingPayment = localStorage.getItem('pending_payment');
    if (pendingPayment) {
      const paymentData = JSON.parse(pendingPayment);
      setEmail(paymentData.email);
      setPhoneNumber(paymentData.phoneNumber);
      setPaymentId(paymentData.paymentId);
      setStep("success");
      
      // Clear stored payment data
      localStorage.removeItem('pending_payment');
    }
  });

  if (step === "success") {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border text-center">
        <div className="space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold text-green-600">Payment Processing! 🎉</h3>
          <p className="text-gray-600">
            Complete your payment in the new tab. Your download link will be sent automatically to WhatsApp!
          </p>
          
          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Automatic Delivery</span>
            </div>
            <p className="text-sm text-gray-600">
              After payment completion, you'll receive:
            </p>
            <div className="space-y-2 text-sm text-left">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-500" />
                <span>Google Drive download link via WhatsApp</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-500" />
                <span>WhatsApp community group invite</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-purple-500" />
                <span>Access restricted to: {email}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Check your WhatsApp after payment completion. 
              The download link will be sent automatically to {phoneNumber}
            </p>
          </div>

          <Button
            onClick={onOrderComplete}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg rounded-xl"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">🚀 Complete Your Order</h3>
          <p className="text-gray-600">Enter your details for automatic delivery after payment!</p>
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
        <p className="text-gray-600">Pay securely via Razorpay - Download link will be sent automatically!</p>
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>🚀 Automatic Delivery Process:</strong><br/>
            1. Click "Pay with Razorpay" below<br/>
            2. Complete payment securely<br/>
            3. <strong>Your download link will be sent automatically to WhatsApp!</strong><br/>
            4. Google Drive access will be granted to your email<br/>
            5. You'll receive a WhatsApp group invite
          </p>
        </div>

        <Button
          onClick={initiateRazorpayPayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
        >
          {isProcessing ? (
            "Opening Payment Gateway..."
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
