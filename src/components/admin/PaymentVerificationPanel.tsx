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
  Search,
  RefreshCw,
  DollarSign,
  User,
  Calendar,
  ExternalLink,
  Mail
} from 'lucide-react';

interface PendingPayment {
  id: string;
  user_id?: string;
  email: string;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  upi_reference_id?: string;
  razorpay_payment_id?: string;
  payment_proof_url?: string;
  google_drive_link?: string;
  whatsapp_group?: string;
  created_at: string;
  status: string;
  users?: {
    name: string;
    email: string;
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
      // Get payments that need verification
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users!payments_user_id_fkey (name, email)
        `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match component expectations
      const transformedData = data?.map(payment => ({
        ...payment,
        users: payment.users || { 
          name: payment.email?.split('@')[0] || 'Unknown',
          email: payment.email || 'No email'
        }
      })) || [];
      
      setPendingPayments(transformedData);
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

  const verifyPayment = async (paymentId: string, userId?: string) => {
    try {
      // Update payment status to completed
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Grant user access if we have a valid user
      if (userId) {
        const { error: accessError } = await supabase
          .from('user_product_access')
          .insert({
            user_id: userId,
            product_id: 'manual-verification', // Generic product ID for manual verification
            payment_id: paymentId,
            granted_at: new Date().toISOString()
          });

        if (accessError && !accessError.message.includes('duplicate')) {
          console.warn('Could not create access record:', accessError);
          // Don't throw error - payment is still verified
        }
      }

      toast({
        title: "Payment Verified ✅",
        description: "Payment has been verified and access granted",
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
    (payment.users?.email || payment.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.users?.name || payment.email?.split('@')[0] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.razorpay_payment_id || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const getMethodBadge = (method?: string) => {
    const methodColors = {
      'upi': 'bg-blue-100 text-blue-800',
      'razorpay': 'bg-purple-100 text-purple-800',
      'manual_verification': 'bg-orange-100 text-orange-800'
    };

    const displayMethod = method || 'razorpay';
    const colorClass = methodColors[displayMethod as keyof typeof methodColors] || 'bg-gray-100 text-gray-800';

    return (
      <Badge className={colorClass}>
        {displayMethod.replace('_', ' ').toUpperCase()}
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
          placeholder="Search by email, name, or transaction ID..."
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
                  {new Set(pendingPayments.map(p => p.user_id || p.email)).size}
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
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <CardTitle className="text-lg">
                        {payment.users?.name || payment.email?.split('@')[0] || 'Unknown User'}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{payment.users?.email || payment.email}</p>
                      </div>
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
                    <Label className="text-sm font-medium text-gray-700">Payment Date</Label>
                    <p className="text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                    <p className="text-sm">{payment.payment_method || 'Razorpay'}</p>
                  </div>
                  
                  {payment.transaction_id && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Transaction ID</Label>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded">{payment.transaction_id}</p>
                    </div>
                  )}
                  
                  {payment.razorpay_payment_id && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Razorpay Payment ID</Label>
                      <p className="text-sm font-mono bg-purple-50 p-2 rounded">{payment.razorpay_payment_id}</p>
                    </div>
                  )}
                  
                  {payment.upi_reference_id && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">UPI Reference</Label>
                      <p className="text-sm font-mono bg-blue-50 p-2 rounded">{payment.upi_reference_id}</p>
                    </div>
                  )}

                  {payment.google_drive_link && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Drive Link</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(payment.google_drive_link, '_blank')}
                        className="mt-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Drive Link
                      </Button>
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
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Payment Proof
                    </Button>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={() => verifyPayment(payment.id, payment.user_id)}
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
