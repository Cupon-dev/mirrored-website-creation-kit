
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, CheckCircle } from 'lucide-react';

const ManualPaymentEntry = () => {
  const [formData, setFormData] = useState({
    userEmail: '',
    productId: '',
    amount: '',
    razorpayPaymentId: 'pay_QkIJeiMIgvlEAQ', // Pre-filled with user's payment
    productName: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Find or create user
      let userData;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', formData.userEmail)
        .single();

      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: formData.userEmail,
            name: formData.userEmail.split('@')[0],
            mobile_number: '0000000000', // Default mobile number
            is_verified: true
          })
          .select()
          .single();

        if (createError) throw createError;
        userData = newUser;
      } else {
        userData = existingUser;
      }

      // 2. Create payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userData.id,
          email: formData.userEmail,
          amount: parseFloat(formData.amount),
          status: 'completed',
          payment_method: 'razorpay',
          razorpay_payment_id: formData.razorpayPaymentId,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 3. Grant access
      const { error: accessError } = await supabase
        .from('user_product_access')
        .insert({
          user_id: userData.id,
          product_id: formData.productId || 'manual-product-access',
          payment_id: paymentRecord.id
        });

      if (accessError && !accessError.message.includes('duplicate')) {
        throw accessError;
      }

      toast({
        title: "Payment Added Successfully! ✅",
        description: `Access granted to ${formData.userEmail} for payment ${formData.razorpayPaymentId}`,
        duration: 6000,
      });

      // Reset form
      setFormData({
        userEmail: '',
        productId: '',
        amount: '',
        razorpayPaymentId: '',
        productName: ''
      });

    } catch (error: any) {
      console.error('Error adding manual payment:', error);
      toast({
        title: "Error Adding Payment",
        description: error.message || "Failed to add payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Manual Payment Entry</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Emergency Payment Recovery</h4>
          <p className="text-yellow-700 text-sm">
            Use this to manually add the Razorpay payment that wasn't captured automatically.
            Payment ID: <strong>pay_QkIJeiMIgvlEAQ</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userEmail">User Email *</Label>
              <Input
                id="userEmail"
                type="email"
                value={formData.userEmail}
                onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
                placeholder="user@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="amount">Payment Amount *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="299"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="razorpayPaymentId">Razorpay Payment ID *</Label>
              <Input
                id="razorpayPaymentId"
                value={formData.razorpayPaymentId}
                onChange={(e) => setFormData({...formData, razorpayPaymentId: e.target.value})}
                placeholder="pay_QkIJeiMIgvlEAQ"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="productId">Product ID (Optional)</Label>
              <Input
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
                placeholder="product-uuid or leave blank"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="productName">Product Name (Reference)</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData({...formData, productName: e.target.value})}
              placeholder="Product name for reference"
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Add Payment & Grant Access
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">✅ What This Does:</h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Creates/finds user account</li>
            <li>• Records the payment as completed</li>
            <li>• Grants immediate access to user</li>
            <li>• User can now access purchased content</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualPaymentEntry;
