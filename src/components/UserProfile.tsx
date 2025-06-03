
import { useState, useEffect } from 'react';
import { User, Download, ShoppingBag, Calendar, Award, CheckCircle } from 'lucide-react';
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
  const { userAccess } = useUserAccess();
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (user && userAccess.length > 0) {
      fetchPurchasedProducts();
    } else if (user) {
      // Check for pending payments and verify
      verifyUserPayments();
    } else {
      setIsLoading(false);
    }
  }, [user, userAccess]);

  const verifyUserPayments = async () => {
    if (!user?.email) return;
    
    setIsVerifying(true);
    try {
      const result = await verifyPaymentAndGrantAccess(user.email, user.id);
      if (result.success) {
        // Refresh the page to update access
        window.location.reload();
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  const fetchPurchasedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, download_link')
        .in('id', userAccess);

      if (error) throw error;

      const productsWithDate = data?.map(product => ({
        ...product,
        purchased_at: new Date().toISOString()
      })) || [];

      setPurchasedProducts(productsWithDate);
    } catch (error) {
      console.error('Error fetching purchased products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading || isVerifying) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          {userAccess.length > 0 && (
            <Badge className="bg-green-100 text-green-800 text-xs mt-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified Access
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{user.visit_count || 0}</div>
          <div className="text-xs text-gray-500">Total Visits</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{purchasedProducts.length}</div>
          <div className="text-xs text-gray-500">Products Owned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{user.login_streak || 0}</div>
          <div className="text-xs text-gray-500">Login Streak</div>
        </div>
      </div>

      {/* Purchased Products */}
      {purchasedProducts.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Your Products ({purchasedProducts.length})
          </h4>
          <div className="space-y-3">
            {purchasedProducts.map((product) => (
              <div key={product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 truncate">{product.name}</h5>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>₹{Number(product.price).toLocaleString('en-IN')}</span>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      Purchased
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => product.download_link && window.open(product.download_link, '_blank')}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={!product.download_link}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Access
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {purchasedProducts.length === 0 && (
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No products purchased yet</p>
          <p className="text-sm text-gray-400">Start shopping to see your products here!</p>
          <Button
            onClick={verifyUserPayments}
            variant="outline"
            className="mt-3 text-sm"
            disabled={isVerifying}
          >
            {isVerifying ? 'Checking...' : 'Check for Recent Purchases'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
