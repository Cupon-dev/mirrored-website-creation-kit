
import { Heart, ShoppingBag, Star, ExternalLink, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useUserAccess } from "@/hooks/useUserAccess";
import FOMOCounter from "./FOMOCounter";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  discount_percentage: number;
  image_url: string;
  brand?: string;
  rating: number;
  review_count: number;
  stock_quantity: number;
  download_link?: string;
}

interface ProductCardProps {
  product: Product;
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
  isWishlisted 
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { hasAccess } = useUserAccess();
  const userHasAccess = hasAccess(product.id);

  const handleDemoClick = () => {
    // Demo video link - you can customize this URL
    window.open('https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view', '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Image Container */}
      <div className="relative">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-32 sm:h-40 md:h-48 object-cover cursor-pointer"
          onClick={() => navigate(`/product/${product.id}`)}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount_percentage > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">
              -{product.discount_percentage}%
            </Badge>
          )}
          {product.stock_quantity <= 20 && (
            <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0.5 animate-pulse">
              Only {product.stock_quantity} left!
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onWishlistToggle(product.id)}
          className="absolute top-2 right-2 p-1.5 h-auto bg-white/80 hover:bg-white rounded-full"
        >
          <Heart 
            className={`w-3 h-3 sm:w-4 sm:h-4 ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
          />
        </Button>

        {/* Access Status */}
        {userHasAccess && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-green-500 text-white text-xs px-2 py-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              Owned
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* FOMO Counter */}
        <FOMOCounter productId={product.id} />

        {/* Brand & Rating */}
        <div className="flex items-center justify-between text-xs">
          {product.brand && (
            <span className="text-gray-500 truncate">{product.brand}</span>
          )}
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{product.rating}</span>
            <span className="text-gray-500">({product.review_count})</span>
          </div>
        </div>

        {/* Product Name */}
        <h3 
          className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 cursor-pointer hover:text-green-600 transition-colors"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center flex-wrap gap-1 sm:gap-2">
          <span className="text-base sm:text-lg font-bold text-gray-900">
            ₹{Number(product.price).toLocaleString('en-IN')}
          </span>
          {product.original_price && (
            <span className="text-xs sm:text-sm text-gray-500 line-through">
              ₹{Number(product.original_price).toLocaleString('en-IN')}
            </span>
          )}
          {product.discount_percentage > 0 && (
            <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5">
              Save ₹{(Number(product.original_price) - Number(product.price)).toLocaleString('en-IN')}
            </Badge>
          )}
        </div>

        {/* Trust Signals */}
        <div className="flex items-center gap-2 text-xs text-green-600">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Instant Access</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {userHasAccess ? (
            <Button
              onClick={() => product.download_link && window.open(product.download_link, '_blank')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 sm:py-3 text-xs sm:text-sm rounded-lg"
              disabled={!product.download_link}
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Access Your Content
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => onPurchase(product.id)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 sm:py-3 text-xs sm:text-sm rounded-lg shadow-lg transform transition hover:scale-[1.02]"
              >
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                BUY NOW
              </Button>
              
              <Button
                onClick={handleDemoClick}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 text-xs sm:text-sm rounded-lg transition-all"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                WATCH DEMO
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
