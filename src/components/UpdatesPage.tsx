
import { useEffect, useState } from 'react';
import { ArrowLeft, Package, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useNavigate } from 'react-router-dom';

interface UpdatesPageProps {
  onBack: () => void;
}

interface ProductNotification {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  created_at: string;
  category_name?: string;
  isNew: boolean;
}

const UpdatesPage = ({ onBack }: UpdatesPageProps) => {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const [notifications, setNotifications] = useState<ProductNotification[]>([]);
  const [lastViewedDate, setLastViewedDate] = useState<string>('');

  useEffect(() => {
    // Get the last viewed date from localStorage
    const storedDate = localStorage.getItem('updates_last_viewed');
    const lastViewed = storedDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Default to 7 days ago
    setLastViewedDate(lastViewed);

    // Filter products created after last viewed date
    const newProducts = products
      .filter(product => new Date(product.created_at) > new Date(lastViewed))
      .map(product => ({
        ...product,
        category_name: product.categories?.name,
        isNew: true
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Also include some recent products for context
    const recentProducts = products
      .filter(product => new Date(product.created_at) <= new Date(lastViewed))
      .slice(0, 5)
      .map(product => ({
        ...product,
        category_name: product.categories?.name,
        isNew: false
      }));

    setNotifications([...newProducts, ...recentProducts]);

    // Update last viewed date
    localStorage.setItem('updates_last_viewed', new Date().toISOString());
  }, [products]);

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const newProductsCount = notifications.filter(n => n.isNew).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900 text-lg">Updates</h1>
              {newProductsCount > 0 && (
                <p className="text-sm text-gray-500">{newProductsCount} new products</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No updates yet</h3>
            <p className="text-gray-500">We'll notify you when new products are added!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {newProductsCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-1">🎉 New Products Available!</h2>
                <p className="text-blue-700">{newProductsCount} new products have been added to our store.</p>
              </div>
            )}

            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md ${
                  notification.isNew ? 'border-blue-200 bg-blue-50' : ''
                }`}
                onClick={() => handleProductClick(notification.id)}
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={notification.image_url || '/placeholder.svg'}
                    alt={notification.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">{notification.name}</h3>
                          {notification.isNew && (
                            <Badge className="bg-blue-500 text-white text-xs">NEW</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(notification.created_at)}</span>
                            </div>
                            {notification.category_name && (
                              <Badge variant="outline" className="text-xs">
                                {notification.category_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-green-600">
                              ₹{Number(notification.price).toLocaleString('en-IN')}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesPage;
