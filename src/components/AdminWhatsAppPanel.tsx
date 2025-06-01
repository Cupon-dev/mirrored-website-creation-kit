
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminWhatsAppPanel = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Default message template
  const defaultMessage = `🎉 *Payment Received - Order Confirmed!* 🎉

Thank you for your purchase!

*Payment Details:*
*Amount:* ₹{amount}
*Payment ID:* {payment_id}

📥 *Your Download Link:*
{drive_link}

👥 *Join our WhatsApp Community:*
https://chat.whatsapp.com/IBcU8C5J1S6707J9rDdF0X

*Instructions:*
1. Click the download link above to access your content
2. Make sure you're logged into Google with: {email}
3. Join our community for updates and support

Need help? Reply to this message!

Thank you for choosing us! 🚀`;

  const fetchRecentPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppLink = (phone: string, messageText: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const encodedMessage = encodeURIComponent(messageText);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  const handleSendMessage = (payment?: any) => {
    const targetPhone = payment?.mobile_number || phoneNumber;
    let messageText = message || defaultMessage;

    if (payment) {
      messageText = defaultMessage
        .replace('{amount}', payment.amount?.toString() || '0')
        .replace('{payment_id}', payment.razorpay_payment_id || 'N/A')
        .replace('{drive_link}', payment.google_drive_link || '')
        .replace('{email}', payment.email || '');
    }

    const whatsappUrl = generateWhatsAppLink(targetPhone, messageText);
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp Opened",
      description: "Message ready to send from your WhatsApp",
    });
  };

  const copyMessage = (payment?: any) => {
    let messageText = message || defaultMessage;

    if (payment) {
      messageText = defaultMessage
        .replace('{amount}', payment.amount?.toString() || '0')
        .replace('{payment_id}', payment.razorpay_payment_id || 'N/A')
        .replace('{drive_link}', payment.google_drive_link || '')
        .replace('{email}', payment.email || '');
    }

    navigator.clipboard.writeText(messageText);
    toast({
      title: "Message Copied",
      description: "Message copied to clipboard",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            <span>WhatsApp Admin Panel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                placeholder="919597822914"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => fetchRecentPayments()} disabled={loading} className="w-full">
                {loading ? "Loading..." : "Load Recent Payments"}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Custom Message</label>
            <Textarea
              placeholder="Enter custom message or leave empty for default template"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={() => handleSendMessage()}
              className="bg-green-600 hover:bg-green-700"
              disabled={!phoneNumber}
            >
              <Send className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </Button>
            <Button 
              variant="outline"
              onClick={() => copyMessage()}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments - Quick Send</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium">{payment.email}</div>
                    <div className="text-sm text-gray-600">
                      {payment.mobile_number} • ₹{payment.amount} • {payment.razorpay_payment_id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(payment.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyMessage(payment)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSendMessage(payment)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminWhatsAppPanel;
