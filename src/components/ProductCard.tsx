
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Eye, ShoppingBag, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useProductAnalytics } from '@/hooks/useProductAnalytics';

interface ProductCardProps {
  product: any;
  onAddToCart: (productId: string) => void;
  onPurchase: (productId: string) => void;
  onWishlistToggle: (productId: string) => void;
  isWishlisted: boolean;
}

const ProductCard = ({ product, onAddToCart, onPurchase, onWishlistToggle, isWishlisted }: ProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess } = useUserAccess();
  const analytics = useProductAnalytics(product.id);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleProductClick = () => {
    navigate(`/product/${product.id}`);
  };

  const userHasAccess = user && hasAccess(product.id);

  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] group"
      onClick={handleProductClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        {/* Product Image */}
        <div className="relative h-32 md:h-48 bg-gray-100">
          <img 
            src={product.image_url}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isHovered ? 'scale-110' : 'scale-100'}`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>

        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 space-y-1">
          {product.discount_percentage > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-1 animate-pulse">
              {product.discount_percentage}% OFF
            </Badge>
          )}
          {product.stock_quantity <= 20 && (
            <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
              Only {product.stock_quantity} left!
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white p-0 transition-all hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            onWishlistToggle(product.id);
          }}
        >
          <Heart 
            className={`w-4 h-4 transition-all ${
              isWishlisted 
                ? "fill-red-500 text-red-500" 
                : "text-gray-400 hover:text-red-400"
            }`}
          />
        </Button>

        {/* Quick Action Overlay - Myntra Style */}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            {userHasAccess ? (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(product.download_link, '_blank');
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 text-sm rounded-lg"
              >
                Access Product
              </Button>
            ) : (
              <>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPurchase(product.id);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 text-sm rounded-lg"
                >
                  BUY NOW
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product.id);
                  }}
                  variant="outline"
                  className="w-full border-white text-white hover:bg-white hover:text-green-600 font-medium py-2 text-sm rounded-lg"
                >
                  ADD TO CART
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-3 md:p-4 space-y-2">
        {/* FOMO Counter */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 text-green-600">
            <Eye className="w-3 h-3" />
            <span>{analytics.current_viewers.toLocaleString('en-IN')} viewing</span>
          </div>
          <div className="flex items-center space-x-1 text-blue-600">
            <ShoppingBag className="w-3 h-3" />
            <span>{analytics.total_purchases.toLocaleString('en-IN')} sold</span>
          </div>
        </div>

        {/* Brand and Rating */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">{product.brand}</span>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{product.rating}</span>
            <span className="text-xs text-gray-500">({product.review_count})</span>
          </div>
        </div>
        
        {/* Product Name */}
        <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-green-600 transition-colors">
          {product.name}
        </h4>
        
        {/* Price Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-900 text-lg">₹{Number(product.price).toLocaleString('en-IN')}</span>
            {product.original_price && (
              <span className="text-sm text-gray-500 line-through">₹{Number(product.original_price).toLocaleString('en-IN')}</span>
            )}
          </div>
          {userHasAccess && (
            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
              Owned ✓
            </Badge>
          )}
        </div>

        {/* High Demand Badge */}
        {analytics.current_viewers > 8000 && (
          <Badge className="w-full justify-center bg-red-100 text-red-800 animate-pulse text-xs py-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            High Demand!
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
