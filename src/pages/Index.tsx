import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, Filter, Star, Home, Compass, Bell, User, Zap, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts(selectedCategory === 'all' ? undefined : selectedCategory);
  const { addToCart, cartCount, isProductInCart } = useCart();
  const { user, logout } = useAuth();

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleBuyNow = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isProductInCart(productId)) {
      addToCart({ productId });
    }
    navigate('/cart');
  };

  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isProductInCart(productId)) {
      addToCart({ productId });
    } else {
      navigate('/cart');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-lime-400 to-green-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs md:text-sm">P</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-500">Welcome back!</p>
              <p className="font-semibold text-gray-900 text-sm md:text-base">{user?.name} 👋</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/cart')}
              className="relative p-2"
            >
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={logout}
              className="p-2"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3 md:py-4 bg-white border-b">
        <div className="max-w-7xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <Input 
            placeholder="What's on your list?" 
            className="pl-10 pr-4 py-2 md:py-3 rounded-xl border-gray-200 focus:border-lime-400 text-sm md:text-base"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-lime-200 to-green-300 rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 md:mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">🔥 Digital Products Sale!</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">Instant delivery via WhatsApp!</p>
            <div className="flex items-center space-x-2 mb-3 md:mb-4">
              <span className="text-3xl md:text-4xl font-bold text-red-500">50</span>
              <div className="text-xs md:text-sm">
                <span className="text-gray-600">% OFF</span>
              </div>
            </div>
            <Button className="bg-white text-gray-800 hover:bg-gray-100 font-medium px-4 md:px-6 text-sm md:text-base transform transition hover:scale-105">
              🛍️ Shop Now
            </Button>
          </div>
          <div className="absolute right-2 md:right-4 top-2 md:top-4 w-20 h-20 md:w-32 md:h-32 opacity-20">
            <TrendingUp className="w-full h-full text-white" />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Categories</h3>
          </div>
          <div className="flex space-x-2 md:space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? "default" : "outline"}
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap ${
                selectedCategory === 'all'
                  ? "bg-lime-400 text-gray-800 hover:bg-lime-500" 
                  : "border-gray-200 hover:border-lime-400"
              }`}
            >
              🛍️ All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap ${
                  selectedCategory === category.id
                    ? "bg-lime-400 text-gray-800 hover:bg-lime-500" 
                    : "border-gray-200 hover:border-lime-400"
                }`}
              >
                {category.icon && <span className="mr-1 md:mr-2">{category.icon}</span>}
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Trending Products</h3>
          <div className="flex items-center space-x-2 md:space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button variant="outline" size="sm" className="rounded-lg text-xs whitespace-nowrap">
              <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg text-xs whitespace-nowrap">
              Ratings
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg text-xs whitespace-nowrap">
              Price
            </Button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
          {products.map((product) => {
            const inCart = isProductInCart(product.id);
            return (
              <div 
                key={product.id} 
                className="bg-white rounded-xl md:rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:scale-[1.02]"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="relative">
                  <img 
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-32 md:h-48 object-cover"
                  />
                  <div className="absolute top-2 md:top-3 left-2 md:left-3">
                    {product.discount_percentage > 0 && (
                      <Badge className="bg-red-500 text-white rounded-lg px-1.5 md:px-2 py-0.5 md:py-1 text-xs animate-pulse">
                        -{product.discount_percentage}% OFF
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 md:top-3 right-2 md:right-3 w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/90 hover:bg-white p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                  >
                    <Heart 
                      className={`w-3 h-3 md:w-4 md:h-4 ${
                        wishlist.includes(product.id) 
                          ? "fill-red-500 text-red-500" 
                          : "text-gray-400"
                      }`}
                    />
                  </Button>
                  {product.stock_quantity <= 20 && (
                    <Badge className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded animate-bounce">
                      Only {product.stock_quantity} left!
                    </Badge>
                  )}
                </div>
                
                <div className="p-2 md:p-4">
                  <div className="flex items-center space-x-1 mb-1 md:mb-2">
                    <span className="text-xs text-gray-600">{product.brand}</span>
                    <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{product.rating}</span>
                    <span className="text-xs text-gray-500">({product.review_count})</span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 text-xs md:text-sm mb-2 md:mb-3 leading-tight line-clamp-2">
                    {product.name}
                  </h4>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <span className="font-bold text-gray-900 text-sm md:text-base">${product.price}</span>
                      {product.original_price && (
                        <span className="text-xs text-gray-500 line-through">${product.original_price}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 md:space-x-2">
                    <Button 
                      size="sm" 
                      onClick={(e) => handleBuyNow(product.id, e)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg px-2 md:px-3 text-xs font-bold transform transition hover:scale-105"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Buy Now
                    </Button>
                    <Button 
                      size="sm" 
                      variant={inCart ? "default" : "outline"}
                      onClick={(e) => handleAddToCart(product.id, e)}
                      className={`rounded-lg px-2 md:px-3 text-xs ${
                        inCart 
                          ? "bg-green-500 text-white hover:bg-green-600" 
                          : "border-lime-400 text-lime-700 hover:bg-lime-50"
                      }`}
                    >
                      {inCart ? "Selected" : "Add"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Cart Summary */}
        {cartCount > 0 && (
          <div 
            className="fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-lime-400 text-gray-800 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg flex items-center space-x-2 md:space-x-3 z-50 mx-4 cursor-pointer hover:bg-lime-500 transition-all animate-pulse"
            onClick={() => navigate('/cart')}
          >
            <span className="font-medium text-sm md:text-base">View Cart</span>
            <Badge className="bg-white text-gray-800 rounded-full text-xs animate-bounce">
              {cartCount}
            </Badge>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-around">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2">
            <Home className="w-5 h-5 text-gray-800" />
            <span className="text-xs text-gray-800 font-medium">Home</span>
            <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2">
            <Compass className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Explore</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Notification</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
