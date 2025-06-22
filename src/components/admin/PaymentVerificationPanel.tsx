import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Search,
  RefreshCw,
  DollarSign,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface PendingPayment {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  upi_reference_id?: string;
  payment_proof_url?: string;
  created_at: string;
  status: string;
  users: {
    name: string;
    email: string;
  };
  products: {
    name: string;
  };
}

const PaymentVerificationPanel = () => {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPayments();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users (name, email),
          products (name)
        `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string, userId: string, productId: string) => {
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Grant user access
      const { error: accessError } = await supabase
        .from('user_product_access')
        .insert({
          user_id: userId,
          product_id: productId,
          payment_id: paymentId,
          granted_at: new Date().toISOString()
        });

      if (accessError && !accessError.message.includes('duplicate')) {
        throw accessError;
      }

      toast({
        title: "Payment Verified ✅",
        description: "User access has been granted successfully",
        duration: 4000,
      });

      // Refresh the list
      fetchPendingPayments();

    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'rejected',
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment Rejected ❌",
        description: "Payment has been marked as rejected",
        duration: 4000,
      });

      fetchPendingPayments();

    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject payment",
        variant: "destructive",
      });
    }
  };

  const filteredPayments = pendingPayments.filter(payment =>
    payment.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMethodBadge = (method: string) => {
    const variants = {
      'upi': 'default',
      'razorpay': 'secondary',
      'manual_verification': 'outline'
    } as const;

    return (
      <Badge variant={variants[method as keyof typeof variants] || 'outline'}>
        {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Verification</h2>
          <p className="text-gray-600">
            {pendingPayments.length} payments pending verification
          </p>
        </div>
        <Button onClick={fetchPendingPayments} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by email, name, product, or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold">
                  ₹{pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Unique Users</p>
                <p className="text-2xl font-bold">
                  {new Set(pendingPayments.map(p => p.user_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading pending payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">No Pending Payments</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No payments match your search criteria.' : 'All payments have been verified!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <CardTitle className="text-lg">{payment.users.name}</CardTitle>
                      <p className="text-sm text-gray-600">{payment.users.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </p>
                    {getMethodBadge(payment.payment_method)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Product</Label>
                    <p className="text-sm">{payment.products.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Payment Date</Label>
                    <p className="text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                  
                  {payment.transaction_id && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Transaction ID</Label>
                      <p className="text-sm font-mono">{payment.transaction_id}</p>
                    </div>
                  )}
                  
                  {payment.upi_reference_id && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">UPI Reference</Label>
                      <p className="text-sm font-mono">{payment.upi_reference_id}</p>
                    </div>
                  )}
                </div>

                {payment.payment_proof_url && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Payment Proof</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(payment.payment_proof_url, '_blank')}
                      className="mt-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Proof
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={() => verifyPayment(payment.id, payment.user_id, payment.product_id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify & Grant Access
                  </Button>
                  
                  <Button
                    onClick={() => rejectPayment(payment.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentVerificationPanel;
