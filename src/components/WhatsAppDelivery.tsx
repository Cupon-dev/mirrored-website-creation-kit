
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Download, ExternalLink, CreditCard } from "lucide-react";
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
  const [step, setStep] = useState<"details" | "payment">("details");
  const { toast } = useToast();

  // Google Drive link for the digital product
  const driveLink = "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link";

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

  const handlePaymentComplete = async () => {
    try {
      setIsProcessing(true);

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          email: email,
          mobile_number: phoneNumber,
          amount: cartTotal,
          google_drive_link: driveLink,
          status: 'pending'
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Format phone number (remove spaces, dashes, etc.)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Create message with order details and download link
      const orderDetails = cartItems.map(item => 
        `• ${item.products?.name} (Qty: ${item.quantity}) - $${(item.products?.price * item.quantity).toFixed(2)}`
      ).join('\n');

      const message = `🎉 *Payment Received - Order Confirmed!* 🎉

Thank you for your purchase!

*Order Summary:*
${orderDetails}

*Total: $${cartTotal.toFixed(2)}*
*Email: ${email}*

📥 *Your Download Link:*
${driveLink}

*Instructions:*
1. Click the link above
2. Save to your Google Drive for lifetime access
3. Download anytime from your saved files

Need help? Reply to this message!

Thank you for choosing us! 🚀`;

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      // Update payment status
      await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          verified_at: new Date().toISOString(),
          whatsapp_sent: true
        })
        .eq('id', payment.id);
      
      setTimeout(() => {
        setIsProcessing(false);
        onOrderComplete();
        toast({
          title: "Order completed!",
          description: "WhatsApp message sent with your download link.",
        });
      }, 2000);
    } catch (error: any) {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (step === "details") {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">🚀 Complete Your Order</h3>
          <p className="text-gray-600">Enter your details to receive instant digital delivery!</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-center text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">You'll receive order confirmation here</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number
            </label>
            <Input
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-center text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
          </div>

          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">${cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">Instant download via WhatsApp</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Lifetime Google Drive access</span>
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
        <h3 className="text-xl font-bold text-gray-900 mb-2">💳 Payment Required</h3>
        <p className="text-gray-600">Complete payment to receive your download link</p>
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Payment Instructions:</strong><br/>
            1. Complete payment via Razorpay<br/>
            2. Return to this page after payment<br/>
            3. Click "Confirm Payment" below<br/>
            4. Receive instant WhatsApp delivery
          </p>
        </div>

        <Button
          onClick={handlePaymentComplete}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
        >
          {isProcessing ? (
            "Processing..."
          ) : (
            <>
              <MessageCircle className="w-5 h-5 mr-2" />
              Confirm Payment & Get Download Link
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
          Click above after completing payment to receive your WhatsApp download link
        </p>
      </div>
    </div>
  );
};

export default WhatsAppDelivery;
