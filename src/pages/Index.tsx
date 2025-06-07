
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag, Heart, Home, Compass, Bell, User, LogOut, LogIn, CheckCircle, XCircle, Eye, Star, ExternalLink, Library, Phone, Mail, X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loginUser, logout } = useAuth();
  const { addToCart, cartCount } = useCart();
  const { data: products, isLoading } = useProducts();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wishlist, setWishlist] = useState([]);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCancel, setShowPaymentCancel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [liveViewing, setLiveViewing] = useState({});
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Categories
  const categories = [
    { id: 'all', name: 'All Products', icon: '🛍️' },
    { id: 'accessories', name: 'Accessories', icon: '💍' },
    { id: 'clothing', name: 'Clothing', icon: '👕' },
    { id: 'bags', name: 'Bags', icon: '👜' },
    { id: 'shoes', name: 'Shoes', icon: '👠' },
    { id: 'wallets', name: 'Wallets', icon: '👛' }
  ];

  // Marketing banners
  const marketingBanners = [
    {
      id: 1,
      text: "🔥 MEGA SALE: 90% OFF on Premium Collections - Limited Time!",
      bgColor: "bg-gradient-to-r from-red-500 to-pink-500",
      textColor: "text-white"
    },
    {
      id: 2,
      text: "✨ NEW ARRIVALS: Exclusive Content Added Daily!",
      bgColor: "bg-gradient-to-r from-blue-500 to-purple-500",
      textColor: "text-white"
    },
    {
      id: 3,
      text: "⚡ FLASH OFFER: Buy 2 Get 1 FREE - Today Only!",
      bgColor: "bg-gradient-to-r from-orange-500 to-yellow-500",
      textColor: "text-white"
    }
  ];

  // Check for payment status from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 5000);
    } else if (status === 'cancelled') {
      setShowPaymentCancel(true);
      setTimeout(() => setShowPaymentCancel(false), 5000);
    }
  }, [searchParams]);

  // Banner rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % marketingBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [marketingBanners.length]);

  // Live viewing simulation
  useEffect(() => {
    const updateViewers = () => {
      const newViewers = {};
      if (products && Array.isArray(products)) {
        products.forEach(product => {
          const baseViewing = product.base_viewing || Math.floor(Math.random() * 100) + 20;
          const variation = Math.floor(Math.random() * 20) - 10;
          newViewers[product.id] = Math.max(1, baseViewing + variation);
        });
      }
      setLiveViewing(newViewers);
    };

    updateViewers();
    const interval = setInterval(updateViewers, 8000);
    return () => clearInterval(interval);
  }, [products]);

  const handleLogin = async () => {
    if (!loginIdentifier.trim()) return;
    
    setIsLoggingIn(true);
    try {
      const result = await loginUser(loginIdentifier);
      if (result.success) {
        setShowLoginDialog(false);
        setLoginIdentifier('');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({ productId: product.id });
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Filter products - add null check for products array
  const filteredProducts = products && Array.isArray(products) ? products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">MarketPlace</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Premium Collections</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Cart Button */}
              <Button
                variant="outline"
                onClick={() => navigate('/cart')}
                className="relative p-2 sm:px-3 sm:py-2"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
                <span className="hidden sm:inline ml-1">Cart</span>
              </Button>

              {/* User Auth */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 hidden sm:inline">Hi, {user.name}</span>
                  <Button variant="outline" onClick={logout} size="sm">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <LogIn className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Login</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Welcome Back!</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter email or mobile number"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <Button 
                        onClick={handleLogin} 
                        disabled={isLoggingIn}
                        className="w-full"
                      >
                        {isLoggingIn ? 'Logging in...' : 'Login'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Marketing Banner */}
      <div className={`${marketingBanners[currentBannerIndex].bgColor} ${marketingBanners[currentBannerIndex].textColor} py-2 px-4 text-center text-sm font-medium transition-all duration-500`}>
        {marketingBanners[currentBannerIndex].text}
      </div>

      {/* Payment Status Notifications */}
      {showPaymentSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 text-center">
          ✅ Payment Successful! Your access has been granted.
        </div>
      )}
      
      {showPaymentCancel && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 text-center">
          ⚠️ Payment was cancelled. You can try again anytime.
        </div>
      )}

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap min-w-fit"
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No products found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden group hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-32 sm:h-40 object-cover cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  />
                  
                  {/* Discount Badge */}
                  {product.discount_percentage && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                      {product.discount_percentage}% OFF
                    </Badge>
                  )}
                  
                  {/* Wishlist Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                      }`}
                    />
                  </Button>

                  {/* Live Viewing */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {liveViewing[product.id] || 0}
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2 cursor-pointer hover:text-green-600" 
                      onClick={() => handleProductClick(product.id)}>
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center mb-2">
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">({product.review_count})</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-green-600">₹{product.price}</span>
                      {product.original_price && (
                        <span className="text-xs text-gray-500 line-through">₹{product.original_price}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
