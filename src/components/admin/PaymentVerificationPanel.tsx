import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Mail,
  Zap,
  Robot,
  AlertTriangle
} from 'lucide-react';

interface Payment {
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
  verified_at?: string;
  notes?: string;
  users?: {
    name: string;
    email: string;
  };
}

const PaymentVerificationPanel = () => {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [completedPayments, setCompletedPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPayments = async () => {
    try {
      // Get pending payments (manual verification needed)
      const { data: pendingData, error: pendingError } = await supabase
        .from('payments')
        .select(`
          *,
          users!payments_user_id_fkey (name, email)
        `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Get recently completed payments (for monitoring)
      const { data: completedData, error: completedError } = await supabase
        .from('payments')
        .select(`
          *,
          users!payments_user_id_fkey (name, email)
        `)
        .eq('status', 'completed')
        .gte('verified_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('verified_at', { ascending: false });

      if (completedError) throw completedError;
      
      // Transform data
      const transformPendingData = pendingData?.map(payment => ({
        ...payment,
        users: payment.users || { 
          name: payment.email?.split('@')[0] || 'Unknown',
          email: payment.email || 'No email'
        }
      })) || [];

      const transformCompletedData = completedData?.map(payment => ({
        ...payment,
        users: payment.users || { 
          name: payment.email?.split('@')[0] || 'Unknown',
          email: payment.email || 'No email'
        }
      })) || [];
      
      setPendingPayments(transformPendingData);
      setCompletedPayments(transformCompletedData);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAutoVerification = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc('auto_verify_razorpay_payments');
      
      if (error) throw error;

      toast({
        title: "Auto-Verification Complete! 🤖",
        description: `Processed ${data || 0} payments automatically`,
        duration: 4000,
      });

      // Refresh the data
      fetchPayments();

    } catch (error: any) {
      console.error('Error running auto-verification:', error);
      toast({
        title: "Auto-Verification Failed",
        description: error.message || "Failed to run automatic verification",
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
          verified_at: new Date().toISOString(),
          notes: 'Manually verified by admin'
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Grant user access if we have a valid user
      if (userId) {
        const { error: accessError } = await supabase
          .from('user_product_access')
          .insert({
            user_id: userId,
            product_id: 'manual-verification',
            payment_id: paymentId,
            granted_at: new Date().toISOString()
          });

        if (accessError && !accessError.message.includes('duplicate')) {
          console.warn('Could not create access record:', accessError);
        }
      }

      toast({
        title: "Payment Verified ✅",
        description: "Payment manually verified and access granted",
        duration: 4000,
      });

      fetchPayments();

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
          verified_at: new Date().toISOString(),
          notes: 'Manually rejected by admin'
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment Rejected ❌",
        description: "Payment has been marked as rejected",
        duration: 4000,
      });

      fetchPayments();

    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject payment",
        variant: "destructive",
      });
    }
  };

  const filteredPendingPayments = pendingPayments.filter(payment =>
    (payment.users?.email || payment.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.users?.name || payment.email?.split('@')[0] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.razorpay_payment_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompletedPayments = completedPayments.filter(payment =>
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

  const getVerificationBadge = (payment: Payment) => {
    if (payment.razorpay_payment_id && payment.notes?.includes('admin')) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <User className="w-3 h-3 mr-1" />
          Manual
        </Badge>
      );
    } else if (payment.razorpay_payment_id) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Robot className="w-3 h-3 mr-1" />
          Auto
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Manual Review
        </Badge>
      );
    }
  };

  const renderPaymentCard = (payment: Payment, showVerificationActions = true) => (
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
            <div className="flex space-x-2 mt-1">
              {getMethodBadge(payment.payment_method)}
              {payment.status === 'completed' && getVerificationBadge(payment)}
            </div>
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
          
          {payment.verified_at && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Verified Date</Label>
              <p className="text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                {formatDate(payment.verified_at)}
              </p>
            </div>
          )}
          
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
        </div>

        {payment.notes && (
          <div>
            <Label className="text-sm font-medium text-gray-700">Notes</Label>
            <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">{payment.notes}</p>
          </div>
        )}

        {showVerificationActions && payment.status === 'pending_verification' && (
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
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Verification</h2>
          <p className="text-gray-600">
            Automatic processing with manual review backup
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={runAutoVerification} variant="outline" size="sm" className="bg-blue-50 border-blue-300 text-blue-700">
            <Robot className="w-4 h-4 mr-2" />
            Run Auto-Verification
          </Button>
          <Button onClick={fetchPayments} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Manual Review</p>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Robot className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Auto-Verified (24h)</p>
                <p className="text-2xl font-bold">{completedPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Pending Amount</p>
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
              <Zap className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Auto Rate</p>
                <p className="text-2xl font-bold">
                  {completedPayments.length > 0 ? Math.round((completedPayments.filter(p => p.razorpay_payment_id).length / completedPayments.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different payment statuses */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Manual Review ({pendingPayments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Recent Completions ({completedPayments.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading pending payments...</p>
            </div>
          ) : filteredPendingPayments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Robot className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">All Caught Up! 🤖</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No payments match your search criteria.' : 'All payments have been automatically verified!'}
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-green-800 text-sm">
                    💡 Payments with valid Razorpay IDs are verified automatically.<br/>
                    Only edge cases require manual review.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPendingPayments.map(payment => renderPaymentCard(payment, true))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredCompletedPayments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Recent Completions</h3>
                <p className="text-gray-600">No payments completed in the last 24 hours.</p>
              </CardContent>
            </Card>
          ) : (
            filteredCompletedPayments.map(payment => renderPaymentCard(payment, false))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentVerificationPanel;
