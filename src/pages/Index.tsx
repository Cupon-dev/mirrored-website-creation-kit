
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, Filter, Star, Home, Compass, Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccess } from "@/hooks/useUserAccess";
import FlashOfferBanner from "@/components/FlashOfferBanner";
import ProductAccessButton from "@/components/ProductAccessButton";
import FOMOCounter from "@/components/FOMOCounter";

const Index = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts(selectedCategory === 'all' ? undefined : selectedCategory);
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { hasAccess } = useUserAccess();

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

  const handlePurchase = (productId: string, price: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Add to cart and navigate to cart for payment
    addToCart({ productId });
    navigate('/cart');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Enhanced Header with User Info */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs md:text-sm">P</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-500">Welcome back, {user?.name}</p>
              <p className="font-semibold text-gray-900 text-sm md:text-base">PremiumLeaks Store 🔥</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {cartCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
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
            placeholder="Find your next digital treasure..." 
            className="pl-10 pr-4 py-2 md:py-3 rounded-xl border-gray-200 focus:border-green-400 text-sm md:text-base transition-all"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Flash Offer Banner */}
        <FlashOfferBanner />

        {/* Categories */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Categories</h3>
          </div>
          <div className="flex space-x-2 md:space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? "default" : "outline"}
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap transition-all active:scale-95 ${
                selectedCategory === 'all'
                  ? "bg-green-500 text-white hover:bg-green-600" 
                  : "border-gray-200 hover:border-green-400 hover:bg-green-50"
              }`}
            >
              🛍️ All Products
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap transition-all active:scale-95 ${
                  selectedCategory === category.id
                    ? "bg-green-500 text-white hover:bg-green-600" 
                    : "border-gray-200 hover:border-green-400 hover:bg-green-50"
                }`}
              >
                {category.icon && <span className="mr-1 md:mr-2">{category.icon}</span>}
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="relative">
                <img 
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 md:h-56 object-cover"
                />
                <div className="absolute top-3 left-3">
                  {product.discount_percentage > 0 && (
                    <Badge className="bg-red-500 text-white rounded-lg px-2 py-1 text-xs animate-pulse">
                      -{product.discount_percentage}% OFF
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white p-0 active:scale-90 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                >
                  <Heart 
                    className={`w-4 h-4 transition-all ${
                      wishlist.includes(product.id) 
                        ? "fill-red-500 text-red-500" 
                        : "text-gray-400"
                    }`}
                  />
                </Button>
                {product.stock_quantity <= 20 && (
                  <Badge className="absolute bottom-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded animate-bounce">
                    Only {product.stock_quantity} left!
                  </Badge>
                )}
              </div>
              
              <div className="p-4">
                <FOMOCounter productId={product.id} />
                
                <div className="flex items-center space-x-1 mb-2">
                  <span className="text-xs text-gray-600">{product.brand}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating}</span>
                  <span className="text-xs text-gray-500">({product.review_count})</span>
                </div>
                
                <h4 className="font-medium text-gray-900 text-sm md:text-base mb-3 leading-tight line-clamp-2">
                  {product.name}
                </h4>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-lg">${product.price}</span>
                    {product.original_price && (
                      <span className="text-sm text-gray-500 line-through">${product.original_price}</span>
                    )}
                  </div>
                  {hasAccess(product.id) && (
                    <Badge className="bg-green-100 text-green-800">Owned ✓</Badge>
                  )}
                </div>
                
                <div onClick={(e) => e.stopPropagation()}>
                  <ProductAccessButton
                    productId={product.id}
                    downloadLink={product.download_link}
                    price={Number(product.price)}
                    onPurchase={() => handlePurchase(product.id, Number(product.price))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User Stats */}
        <div className="bg-green-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Your Activity</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{user?.visit_count || 0}</p>
              <p className="text-sm text-green-700">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{user?.login_streak || 0}</p>
              <p className="text-sm text-green-700">Login Streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{products.filter(p => hasAccess(p.id)).length}</p>
              <p className="text-sm text-green-700">Products Owned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-around">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all">
            <Home className="w-5 h-5 text-gray-800" />
            <span className="text-xs text-gray-800 font-medium">Home</span>
            <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all">
            <Compass className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Explore</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Updates</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Logout</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
