
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppDeliveryProps {
  cartTotal: number;
  cartItems: any[];
  onOrderComplete: () => void;
}

const WhatsAppDelivery = ({ cartTotal, cartItems, onOrderComplete }: WhatsAppDeliveryProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Your Google Drive link
  const driveLink = "https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view?usp=share_link";

  const generateRazorpayLink = () => {
    // You'll need to create these links manually in your Razorpay dashboard
    // For now, using a placeholder - replace with actual Razorpay payment link
    const amount = cartTotal;
    return `https://rzp.io/l/your-payment-link?amount=${amount}`;
  };

  const sendWhatsAppMessage = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your WhatsApp number to receive the download link.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Format phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Create message with order details and download link
    const orderDetails = cartItems.map(item => 
      `• ${item.products?.name} (Qty: ${item.quantity}) - $${(item.products?.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const message = `🎉 *Order Confirmed!* 🎉

Thank you for your purchase!

*Order Summary:*
${orderDetails}

*Total: $${cartTotal.toFixed(2)}*

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
    
    setTimeout(() => {
      setIsProcessing(false);
      onOrderComplete();
      toast({
        title: "Order processed!",
        description: "WhatsApp message prepared. Please send it to complete the delivery.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">🚀 Instant Digital Delivery</h3>
        <p className="text-gray-600">Get your download link via WhatsApp in seconds!</p>
      </div>

      <div className="space-y-4">
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
          onClick={sendWhatsAppMessage}
          disabled={isProcessing || !phoneNumber}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
        >
          {isProcessing ? (
            "Processing..."
          ) : (
            <>
              <MessageCircle className="w-5 h-5 mr-2" />
              Complete Order & Get Download Link
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          By clicking above, you'll be redirected to WhatsApp to receive your download link
        </p>
      </div>
    </div>
  );
};

export default WhatsAppDelivery;
