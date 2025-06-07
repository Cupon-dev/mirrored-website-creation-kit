
import { useState, useEffect } from 'react';
import { User, Download, ShoppingBag, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccess } from '@/hooks/useUserAccess';
import { verifyPaymentAndGrantAccess } from '@/services/paymentService';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    if (user) {
      // Always try to verify payments first
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

  const verifyUserPayments = async () => {
    if (!user?.email) return;
    
    setIsVerifying(true);
    try {
      console.log('Verifying payments for user:', user.email);
      const result = await verifyPaymentAndGrantAccess(user.email, user.id);
      if (result.success) {
        console.log('Payment verification successful, refreshing access');
        await refreshAccess();
      } else {
        console.log('No payments found or verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
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
    await verifyUserPayments();
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

      {purchasedProducts.length === 0 && !isLoading && (
        <div className="text-center py-6 sm:py-8">
          <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm sm:text-base">No products purchased yet</p>
          <p className="text-xs sm:text-sm text-gray-400">Start shopping to see your products here!</p>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="mt-3"
            size="sm"
          >
            Check for Recent Purchases
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
