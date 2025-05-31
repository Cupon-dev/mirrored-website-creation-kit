
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, ShoppingBag, Zap, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { data: product, isLoading } = useProduct(id!);
  const { addToCart } = useCart();

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!product) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Product not found</div>;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-gray-900 truncate mx-4">{product.name}</h1>
          <Button variant="ghost" className="p-2">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={images[selectedImage] || product.image_url}
                alt={product.name}
                className="w-full h-96 md:h-[500px] object-cover rounded-2xl"
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
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className={`w-20 h-20 object-cover rounded-lg cursor-pointer transition-all ${
                      selectedImage === index ? 'ring-2 ring-lime-400' : 'opacity-70'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-500">{product.brand}</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-gray-500">({product.review_count} reviews)</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">${product.price}</span>
              {product.original_price && (
                <span className="text-xl text-gray-500 line-through">${product.original_price}</span>
              )}
              {product.discount_percentage > 0 && (
                <Badge className="bg-green-100 text-green-800">
                  Save ${(Number(product.original_price) - Number(product.price)).toFixed(2)}
                </Badge>
              )}
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto text-lime-500 mb-1" />
                <span className="text-xs text-gray-600">Free Shipping</span>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                <span className="text-xs text-gray-600">30-Day Return</span>
              </div>
              <div className="text-center">
                <Zap className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
                <span className="text-xs text-gray-600">Fast Delivery</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2"
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="px-3 py-2"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleBuyNow}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  BUY NOW - ${(Number(product.price) * quantity).toFixed(2)}
                </Button>
                <Button 
                  onClick={() => addToCart({ productId: product.id, quantity })}
                  variant="outline"
                  className="w-full border-2 border-lime-400 text-lime-700 hover:bg-lime-50 font-semibold py-4 text-lg rounded-xl"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-lime-50 rounded-xl p-4">
              <p className="text-sm text-lime-800 font-medium mb-1">🔥 Hot Item!</p>
              <p className="text-sm text-lime-700">
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
