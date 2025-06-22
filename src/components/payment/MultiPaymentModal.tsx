import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Copy, CreditCard, Smartphone, QrCode, Upload, CheckCircle, Clock, Zap } from 'lucide-react';
import { recordPayment } from '@/services/paymentService';
import { supabase } from '@/integrations/supabase/client';

interface MultiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    razorpay_link?: string;
  };
  onPaymentSuccess: () => void;
}

const MultiPaymentModal = ({ isOpen, onClose, product, onPaymentSuccess }: MultiPaymentModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('razorpay');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const UPI_ID = "creativevibes1993-1@okaxis";
  const QR_CODE_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="; // Replace with actual QR code

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${text} copied to clipboard`,
      duration: 2000,
    });
  };

  const handleRazorpayPayment = () => {
    if (!product.razorpay_link) {
      toast({
        title: "Payment Link Unavailable",
        description: "Please try UPI payment method",
        variant: "destructive",
      });
      return;
    }

    // Store payment info before redirect
    localStorage.setItem('pending_payment', JSON.stringify({
      productId: product.id,
      email: user?.email,
      amount: product.price,
      method: 'razorpay'
    }));

    // Open Razorpay payment link
    window.open(product.razorpay_link, '_blank');
    
    toast({
      title: "Payment Window Opened",
      description: "Complete your payment and return here. Access will be granted automatically!",
      duration: 5000,
    });
  };

  const handleUPIPayment = async () => {
    if (!user?.email) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to make a payment",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Record UPI payment attempt using new service
      const result = await recordPayment(
        user.email,
        product.id,
        product.price,
        'upi',
        {
          transactionId: transactionId || 'upi_payment_' + Date.now(),
          upiRefId: transactionId
        }
      );

      if (result.success) {
        toast({
          title: "Payment Recorded! ✅",
          description: result.message,
          duration: 6000,
        });

        onPaymentSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Payment recording failed');
      }

    } catch (error: any) {
      toast({
        title: "Recording Failed",
        description: error.message || "Please contact support",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProofUpload = async () => {
    if (!paymentProof || !user?.email) {
      toast({
        title: "Missing Information",
        description: "Please upload payment proof and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Upload proof to Supabase Storage
      const fileName = `payment-proof-${Date.now()}-${paymentProof.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // Record payment with proof using new service
      const result = await recordPayment(
        user.email,
        product.id,
        product.price,
        'manual_verification',
        {
          transactionId: transactionId,
          paymentProofUrl: publicUrl
        }
      );

      if (result.success) {
        toast({
          title: "Payment Proof Uploaded! ✅",
          description: result.message,
          duration: 6000,
        });

        onPaymentSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Payment recording failed');
      }

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Complete Your Purchase</span>
          </DialogTitle>
          <DialogDescription>
            Choose your preferred payment method for <strong>{product.name}</strong> - ₹{product.price}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="razorpay" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Razorpay</span>
              <Badge variant="secondary" className="ml-1">Instant</Badge>
            </TabsTrigger>
            <TabsTrigger value="upi" className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4" />
              <span>UPI Direct</span>
              <Badge variant="outline" className="ml-1">30 min</Badge>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Manual</span>
              <Badge variant="outline" className="ml-1">2 hours</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Razorpay Payment */}
          <TabsContent value="razorpay" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Razorpay Payment (Recommended)</span>
                </CardTitle>
                <CardDescription>
                  Secure payment gateway with instant verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Instant Access</h4>
                  <p className="text-green-700 text-sm">
                    Pay securely through Razorpay and get immediate access to your product!
                  </p>
                </div>
                
                <Button 
                  onClick={handleRazorpayPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₹{product.price} with Razorpay
                </Button>
                
                <p className="text-sm text-gray-600 text-center">
                  Supports UPI, Cards, Net Banking & Wallets
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* UPI Direct Payment */}
          <TabsContent value="upi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span>UPI Direct Payment</span>
                </CardTitle>
                <CardDescription>
                  Pay directly via UPI - Access granted within 30 minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="upi-id">UPI ID</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={UPI_ID}
                        readOnly 
                        className="bg-gray-50"
                      />
                      <Button 
                        onClick={() => copyToClipboard(UPI_ID)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount to Pay</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={`₹${product.price}`}
                        readOnly 
                        className="bg-gray-50"
                      />
                      <Button 
                        onClick={() => copyToClipboard(product.price.toString())}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
                    <Input 
                      id="transaction-id"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter UPI transaction ID after payment"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">📱 Payment Instructions</h4>
                  <ol className="text-orange-700 text-sm space-y-1">
                    <li>1. Copy the UPI ID above</li>
                    <li>2. Open your UPI app (GPay, PhonePe, Paytm)</li>
                    <li>3. Send ₹{product.price} to the copied UPI ID</li>
                    <li>4. Click "Confirm Payment" below</li>
                    <li>5. Access granted automatically within 30 minutes!</li>
                  </ol>
                </div>

                <Button 
                  onClick={handleUPIPayment}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Recording Payment...' : 'Confirm UPI Payment'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Verification */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-purple-500" />
                  <span>Manual Verification</span>
                </CardTitle>
                <CardDescription>
                  Upload payment proof for manual verification (2 hours)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="payment-proof">Payment Screenshot/Receipt</Label>
                    <Input 
                      id="payment-proof"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="manual-transaction-id">Transaction ID</Label>
                    <Input 
                      id="manual-transaction-id"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter transaction/reference ID"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">📋 Manual Process</h4>
                  <ol className="text-purple-700 text-sm space-y-1">
                    <li>1. Make payment via any method (UPI/Bank Transfer)</li>
                    <li>2. Take screenshot of successful payment</li>
                    <li>3. Upload the screenshot here</li>
                    <li>4. Our automated system will verify within 2 hours</li>
                    <li>5. Access granted automatically after verification</li>
                  </ol>
                </div>

                <Button 
                  onClick={handleProofUpload}
                  disabled={isProcessing || !paymentProof}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Uploading...' : 'Upload Payment Proof'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            🤖 Automated verification system • 🔒 Secure payment processing • 💯 100% money-back guarantee • 📞 24/7 support
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiPaymentModal;
