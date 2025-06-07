
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, ShoppingBag, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import FOMOCounter from "@/components/FOMOCounter";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useAuth } from "@/hooks/useAuth";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { data: product, isLoading } = useProduct(id!);
  const { addToCart } = useCart();
  const { hasAccess } = useUserAccess();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Product not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const images = product.gallery_images && product.gallery_images.length > 0 
    ? product.gallery_images 
    : [product.image_url];

  const handleBuyNow = () => {
    if (product.razorpay_link) {
      window.open(product.razorpay_link, '_blank');
    } else {
      addToCart({ productId: product.id, quantity });
      navigate('/cart');
    }
  };

  const userHasAccess = user && hasAccess(product.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-gray-900 truncate mx-4 text-sm sm:text-base">{product.name}</h1>
          <Button variant="ghost" className="p-2">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={images[selectedImage] || product.image_url}
                alt={product.name}
                className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover rounded-2xl"
              />
              {product.discount_percentage > 0 && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                  -{product.discount_percentage}% OFF
                </Badge>
              )}
              {product.stock_quantity <= 20 && (
                <Badge className="absolute top-4 right-4 bg-orange-500 text-white animate-pulse">
                  Only {product.stock_quantity} left!
                </Badge>
              )}
              {userHasAccess && (
                <Badge className="absolute bottom-4 left-4 bg-green-500 text-white">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  You Own This
                </Badge>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg cursor-pointer transition-all flex-shrink-0 ${
                      selectedImage === index ? 'ring-2 ring-green-400' : 'opacity-70'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* FOMO Counter */}
            <FOMOCounter productId={product.id} />

            <div>
              <div className="flex items-center flex-wrap gap-2 mb-2">
                {product.brand && (
                  <span className="text-sm text-gray-500">{product.brand}</span>
                )}
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-gray-500">({product.review_count} reviews)</span>
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{product.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              {product.original_price && (
                <span className="text-lg sm:text-xl text-gray-500 line-through">
                  ₹{Number(product.original_price).toLocaleString('en-IN')}
                </span>
              )}
              {product.discount_percentage > 0 && (
                <Badge className="bg-green-100 text-green-800">
                  Save ₹{(Number(product.original_price) - Number(product.price)).toLocaleString('en-IN')}
                </Badge>
              )}
            </div>

            {/* Trust Signals */}
            <div className="bg-green-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3 text-sm text-green-700">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Instant Access</span>
                </div>
              </div>
            </div>

            {/* Quantity Selector - Only show if user doesn't have access */}
            {!userHasAccess && (
              <div className="space-y-4">
                <div className="flex items-center flex-wrap gap-4">
                  <span className="font-medium text-sm sm:text-base">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-sm"
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 border-x text-sm">{quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="px-3 py-2 text-sm"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {userHasAccess ? (
                <Button
                  onClick={() => product.download_link && window.open(product.download_link, '_blank')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 sm:py-4 text-base sm:text-lg rounded-xl"
                  disabled={!product.download_link}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Access Your Content
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleBuyNow}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    BUY NOW - ₹{(product.price * quantity).toLocaleString('en-IN')}
                  </Button>
                  
                  <Button 
                    onClick={() => addToCart({ productId: product.id, quantity })}
                    variant="outline"
                    className="w-full border-2 border-green-400 text-green-700 hover:bg-green-50 font-semibold py-3 sm:py-4 text-base sm:text-lg rounded-xl"
                  >
                    Add to Cart
                  </Button>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className="bg-green-50 rounded-xl p-3 sm:p-4">
              <p className="text-sm font-medium text-green-800 mb-1">🔥 Hot Item!</p>
              <p className="text-sm text-green-700">
                {Math.floor(Math.random() * 50) + 10} people bought this in the last 24 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
