
import { useState, useEffect } from 'react';
import { User, Download, ShoppingBag, CheckCircle, ExternalLink, RefreshCw, AlertCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccess } from '@/hooks/useUserAccess';
import { verifyPaymentAndGrantAccess, fixStuckPayments } from '@/services/paymentService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PurchasedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  download_link?: string;
  purchased_at: string;
}

const UserProfile = () => {
  const { user } = useAuth();
  const { userAccess, refreshAccess, isLoading: accessLoading } = useUserAccess();
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPaymentStats();
      verifyUserPayments();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && userAccess.length > 0) {
      fetchPurchasedProducts();
    } else if (!accessLoading && user) {
      setIsLoading(false);
    }
  }, [userAccess, accessLoading, user]);

  const fetchPaymentStats = async () => {
    if (!user?.email) return;
    
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false });

      if (!error && payments) {
        const stats = {
          total: payments.length,
          completed: payments.filter(p => p.status === 'completed').length,
          pending: payments.filter(p => p.status === 'pending').length,
          failed: payments.filter(p => p.status === 'failed').length,
          withRazorpayId: payments.filter(p => p.razorpay_payment_id).length,
          stuckPayments: payments.filter(p => p.status === 'pending' && p.razorpay_payment_id).length,
          latestPayment: payments[0]
        };
        setPaymentStats(stats);
        console.log('Payment stats:', stats);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const verifyUserPayments = async () => {
    if (!user?.email) return;
    
    setIsVerifying(true);
    try {
      console.log('Verifying payments for user:', user.email);
      const result = await verifyPaymentAndGrantAccess(user.email, user.id);
      
      setDebugInfo(result.debugInfo);
      
      if (result.success) {
        console.log('Payment verification successful');
        await refreshAccess();
        await fetchPaymentStats(); // Refresh stats
        toast({
          title: "Access Granted! 🎉",
          description: "Your purchase has been verified and access granted.",
        });
      } else {
        console.log('Payment verification failed:', result.error);
        toast({
          title: "Payment Check",
          description: result.error || "No completed payments found",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Verification Error",
        description: "Failed to check payment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  const handleFixStuckPayments = async () => {
    if (!user?.email) return;
    
    setIsFixing(true);
    try {
      const result = await fixStuckPayments(user.email);
      
      if (result.success) {
        toast({
          title: "Payments Fixed! ✅",
          description: result.message,
        });
        await fetchPaymentStats();
        await verifyUserPayments();
      } else {
        toast({
          title: "Fix Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fix stuck payments error:', error);
      toast({
        title: "Fix Error",
        description: "Failed to fix stuck payments",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const fetchPurchasedProducts = async () => {
    if (userAccess.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching products for access list:', userAccess);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, download_link')
        .in('id', userAccess);

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      const productsWithDate = data?.map(product => ({
        ...product,
        purchased_at: new Date().toISOString()
      })) || [];

      console.log('Fetched purchased products:', productsWithDate);
      setPurchasedProducts(productsWithDate);
    } catch (error) {
      console.error('Error fetching purchased products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchPaymentStats();
    await verifyUserPayments();
  };

  const handleDebugToggle = () => {
    if (debugInfo || paymentStats) {
      console.log('=== DEBUG INFO ===', { debugInfo, paymentStats });
      toast({
        title: "Debug Info",
        description: "Check console for detailed payment information",
      });
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading || isVerifying || accessLoading) {
    return (
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
            {userAccess.length > 0 && (
              <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                {userAccess.length} Product{userAccess.length > 1 ? 's' : ''} Owned
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {paymentStats?.stuckPayments > 0 && (
            <Button
              onClick={handleFixStuckPayments}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
              disabled={isFixing}
            >
              <Wrench className={`w-4 h-4 ${isFixing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Fix ({paymentStats.stuckPayments})</span>
            </Button>
          )}
          
          {(debugInfo || paymentStats) && (
            <Button
              onClick={handleDebugToggle}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Debug</span>
            </Button>
          )}
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Payment Status Info */}
      {paymentStats && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Payment Status</p>
              <p className="text-xs text-blue-700">
                Total: {paymentStats.total} | Completed: {paymentStats.completed} | 
                Pending: {paymentStats.pending} | Failed: {paymentStats.failed}
              </p>
              {paymentStats.stuckPayments > 0 && (
                <p className="text-xs text-orange-700 font-medium">
                  ⚠️ {paymentStats.stuckPayments} stuck payment(s) detected - click Fix button
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchased Products */}
      {purchasedProducts.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sm:text-base">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Your Products ({purchasedProducts.length})
          </h4>
          <div className="space-y-3">
            {purchasedProducts.map((product) => (
              <div key={product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 truncate text-sm sm:text-base">{product.name}</h5>
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="text-gray-500">₹{Number(product.price).toLocaleString('en-IN')}</span>
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Purchased
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => product.download_link && window.open(product.download_link, '_blank')}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 sm:px-3 sm:py-2"
                  disabled={!product.download_link}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Access</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
