
import { Heart, ShoppingBag, Star, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useProductAnalytics } from "@/hooks/useProductAnalytics";
import { useEffect } from "react";
import ProductAccessButton from "./ProductAccessButton";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    image_url: string;
    rating: number;
    review_count: number;
    discount_percentage: number;
    stock_quantity: number;
    download_link?: string;
  };
  onAddToCart: (productId: string) => void;
  onPurchase: (productId: string) => void;
  onWishlistToggle: (productId: string) => void;
  isWishlisted: boolean;
}

const ProductCard = ({
  product,
  onAddToCart,
  onPurchase,
  onWishlistToggle,
  isWishlisted,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { analytics, incrementViewer, decrementViewer } = useProductAnalytics(product.id);

  useEffect(() => {
    incrementViewer();
    return () => {
      decrementViewer();
    };
  }, [incrementViewer, decrementViewer]);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group relative overflow-hidden">
      {/* Discount Badge */}
      {product.discount_percentage > 0 && (
        <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold animate-pulse">
          -{product.discount_percentage}% OFF
        </Badge>
      )}

      {/* Stock Badge */}
      {product.stock_quantity <= 20 && (
        <Badge className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-xs animate-pulse">
          Only {product.stock_quantity} left!
        </Badge>
      )}

      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onWishlistToggle(product.id);
        }}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded-full transition-all ${
          isWishlisted 
            ? 'text-red-500 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 bg-white/80 hover:bg-white hover:text-red-500'
        } ${product.stock_quantity <= 20 ? 'top-8' : ''}`}
      >
        <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </Button>

      {/* Product Image */}
      <div 
        className="relative overflow-hidden cursor-pointer bg-gray-50"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-32 md:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Quick Action Overlay - Myntra Style */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product.id);
                }}
                className="flex-1 text-xs bg-white/90 hover:bg-white text-gray-900 border-0"
              >
                <ShoppingBag className="w-3 h-3 mr-1" />
                ADD
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase(product.id);
                }}
                className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
              >
                BUY
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 md:p-4 space-y-2">
        {/* Product Name */}
        <h3 
          className="font-medium text-gray-900 text-sm md:text-base line-clamp-2 cursor-pointer hover:text-green-600 transition-colors"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs md:text-sm font-medium text-gray-700">{product.rating}</span>
          </div>
          <span className="text-xs text-gray-500">({product.review_count.toLocaleString()})</span>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-gray-900 text-sm md:text-base">
            {formatPrice(product.price)}
          </span>
          {product.original_price && (
            <>
              <span className="text-xs md:text-sm text-gray-500 line-through">
                {formatPrice(product.original_price)}
              </span>
              <span className="text-xs font-medium text-green-600">
                ({product.discount_percentage}% OFF)
              </span>
            </>
          )}
        </div>

        {/* Analytics - Live counters */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span className="font-medium text-blue-600">
              {analytics.current_viewers.toLocaleString()} viewing
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span className="font-medium text-green-600">
              {analytics.total_purchases.toLocaleString()} bought
            </span>
          </div>
        </div>

        {/* Access Button */}
        <div className="pt-2">
          <ProductAccessButton
            productId={product.id}
            downloadLink={product.download_link}
            price={product.price}
            onPurchase={() => onPurchase(product.id)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
