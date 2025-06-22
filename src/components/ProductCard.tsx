import { Heart, ShoppingBag, Star, ExternalLink, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import FOMOCounter from "./FOMOCounter";
import MultiPaymentModal from "./payment/MultiPaymentModal";

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
  demo_link?: string;
  access_link?: string;
  razorpay_link?: string;
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
  const { hasAccess, refreshAccess } = useUserAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const userHasAccess = user && hasAccess(product.id);

  const handleDemoClick = () => {
    const demoUrl = product.demo_link || 'https://drive.google.com/file/d/1vehhvqFLGcaBANR1qYJ4hzzKwASm_zH3/view';
    window.open(demoUrl, '_blank');
  };

  const handleAccessClick = () => {
    if (userHasAccess && product.access_link) {
      window.open(product.access_link, '_blank');
    }
  };

  const handlePurchaseClick = () => {
    if (userHasAccess) {
      toast({
        title: "Already Owned! 🎉",
        description: "You already have access to this product. Check your library!",
        variant: "default",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please Login First",
        description: "You need to be logged in to make a purchase.",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  const handleAddToCartClick = () => {
    if (userHasAccess) {
      toast({
        title: "Already Owned! 🎉", 
        description: "You already have access to this product. Check your library!",
        variant: "default",
      });
      return;
    }
    onAddToCart(product.id);
  };

  const handlePaymentSuccess = async () => {
    // Refresh user access to get latest permissions
    await refreshAccess();
    
    toast({
      title: "Payment Successful! 🎉",
      description: "Your access will be granted shortly. Check back in a few minutes!",
      duration: 6000,
    });
    
    // Close modal and refresh the page to show updated access
    setShowPaymentModal(false);
    
    // Optional: Navigate to a success page
    // navigate('/payment-success');
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Image Container */}
        <div className="relative">
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-24 sm:h-28 md:h-32 object-cover cursor-pointer"
            onClick={() => navigate(`/product/${product.id}`)}
          />
          
          {/* Top Badges */}
          <div className="absolute top-1 left-1 flex flex-col gap-1">
            {product.discount_percentage > 0 && product.discount_percentage <= 50 && (
              <Badge className="bg-red-500 text-white text-xs px-1 py-0.5">
                -{product.discount_percentage}%
              </Badge>
            )}
            {product.stock_quantity <= 20 && (
              <Badge className="bg-orange-500 text-white text-xs px-1 py-0.5 animate-pulse">
                {product.stock_quantity} left!
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onWishlistToggle(product.id)}
            className="absolute top-1 right-1 p-1 h-auto bg-white/80 hover:bg-white rounded-full"
          >
            <Heart 
              className={`w-3 h-3 ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`} 
            />
          </Button>

          {/* Bottom Left Badges */}
          <div className="absolute bottom-1 left-1 flex flex-col gap-1">
            {userHasAccess && (
              <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">
                <CheckCircle className="w-2 h-2 mr-1" />
                Owned
              </Badge>
            )}
            <FOMOCounter productId={product.id} showOnlyHighDemand={true} />
          </div>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-2.5 space-y-1.5 flex-1 flex flex-col">
          {/* FOMO Counter */}
          <FOMOCounter productId={product.id} hideHighDemand={true} />

          {/* Brand & Rating */}
          <div className="flex items-center justify-between text-xs">
            {product.brand && (
              <span className="text-gray-500 truncate text-xs">{product.brand}</span>
            )}
            <div className="flex items-center space-x-1">
              <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-xs">{product.rating}</span>
              <span className="text-gray-500 text-xs">({product.review_count})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 
            className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 cursor-pointer hover:text-green-600 transition-colors"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center flex-wrap gap-1">
            <span className="text-sm sm:text-base font-bold text-gray-900">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.original_price && (
              <span className="text-xs text-gray-500 line-through">
                ₹{Number(product.original_price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-1 mt-auto">
            {userHasAccess ? (
              <div className="space-y-1">
                {/* Access Button */}
                <Button
                  onClick={handleAccessClick}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-1.5 sm:py-2 text-xs rounded-lg"
                  disabled={!product.access_link}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Access Content</span>
                  <span className="sm:hidden">Access</span>
                </Button>
                
                {/* Demo Button */}
                <Button
                  onClick={handleDemoClick}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 py-1 text-xs rounded-lg"
                >
                  <Play className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Watch Demo</span>
                  <span className="sm:hidden">Demo</span>
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  onClick={handlePurchaseClick}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-1.5 sm:py-2 text-xs rounded-lg"
                >
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">BUY NOW</span>
                  <span className="sm:hidden">BUY</span>
                </Button>
                
                {/* Cart and Demo in single line */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    onClick={handleAddToCartClick}
                    className="flex-1 border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 py-1 text-xs rounded-lg"
                  >
                    <ShoppingBag className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Cart</span>
                    <span className="sm:hidden">🛒</span>
                  </Button>
                  
                  <Button
                    onClick={handleDemoClick}
                    variant="outline"
                    className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 py-1 text-xs rounded-lg"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Payment Modal */}
      <MultiPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        product={product}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default ProductCard;
