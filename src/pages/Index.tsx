import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag, Heart, Home, Compass, Bell, User, LogOut, LogIn, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import FlashOfferBanner from "@/components/FlashOfferBanner";
import ProductCard from "@/components/ProductCard";
import UserProfile from "@/components/UserProfile";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wishlist, setWishlist] = useState([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [userPurchases, setUserPurchases] = useState([]);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCancel, setShowPaymentCancel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts(selectedCategory === 'all' ? undefined : selectedCategory);
  const { addToCart, cartCount } = useCart();
  const { user, logout, loginUser } = useAuth();

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');
    
    if (status === 'success' && sessionId && productId && user) {
      // Save purchase to localStorage
      const existingPurchases = JSON.parse(localStorage.getItem(`purchases_${user.id}`) || '[]');
      if (!existingPurchases.includes(productId)) {
        const updatedPurchases = [...existingPurchases, productId];
        localStorage.setItem(`purchases_${user.id}`, JSON.stringify(updatedPurchases));
        setUserPurchases(updatedPurchases);
      }
      setShowPaymentSuccess(true);
      
      // Clear URL params and hide success message after 3 seconds
      setTimeout(() => {
        setShowPaymentSuccess(false);
        navigate('/', { replace: true });
      }, 3000);
    } else if (status === 'cancel') {
      setShowPaymentCancel(true);
      setTimeout(() => {
        setShowPaymentCancel(false);
        navigate('/', { replace: true });
      }, 3000);
    }
  }, [searchParams, user, navigate]);

  // Load user purchases when user logs in
  useEffect(() => {
    if (user) {
      const savedPurchases = JSON.parse(localStorage.getItem(`purchases_${user.id}`) || '[]');
      setUserPurchases(savedPurchases);
    } else {
      setUserPurchases([]);
    }
  }, [user]);

  const handleLogin = async () => {
    if (!loginIdentifier.trim()) return;
    
    setIsLoggingIn(true);
    const result = await loginUser(loginIdentifier);
    setIsLoggingIn(false);
    
    if (result.success) {
      setShowLoginDialog(false);
      setLoginIdentifier('');
    }
  };

  const checkUserAccess = (productId) => {
    return userPurchases.includes(productId);
  };

  const handlePurchase = async (product) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    // Simulate payment process - in real app, this would redirect to payment processor
    const confirmed = window.confirm(`Purchase ${product.name} for $${product.price}?`);
    if (confirmed) {
      // Simulate payment success
      const updatedPurchases = [...userPurchases, product.id];
      setUserPurchases(updatedPurchases);
      localStorage.setItem(`purchases_${user.id}`, JSON.stringify(updatedPurchases));
      
      // Show success message
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 3000);
    }
  };

  const accessDigitalContent = (productId) => {
    const product = products.find(p => p.id === productId);
    alert(`🎉 Accessing digital content for: ${product?.name || productId}\n\nContent unlocked! You now have full access to this digital product.`);
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">DigitalStore</h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {wishlist.length}
                  </Badge>
                )}
              </Button>

              <Button variant="ghost" size="sm" className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Hi, {user.name || user.email}</span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Login to Your Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Email or Username"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
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

      {/* Flash Offer Banner */}
      <FlashOfferBanner />

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Purchases Summary */}
        {user && userPurchases.length > 0 && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Your Digital Library</h3>
            <p className="text-green-700">
              You have {userPurchases.length} purchased item{userPurchases.length !== 1 ? 's' : ''} with full access.
            </p>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={product.image || "/api/placeholder/300/200"} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  {checkUserAccess(product.id) && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Owned
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-blue-600">${product.price}</span>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  {/* Purchase Status */}
                  {checkUserAccess(product.id) && (
                    <div className="mb-3">
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>Access Granted - Content Available</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {checkUserAccess(product.id) ? (
                      <Button 
                        className="w-full bg-blue-500 hover:bg-blue-600" 
                        onClick={() => accessDigitalContent(product.id)}
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Access Content
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700" 
                          onClick={() => handlePurchase(product)}
                        >
                          Buy Now ${product.price}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => addToCart(product)}
                          className="px-3"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter.</p>
          </div>
        )}
      </main>

      {/* Payment Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Thank you for your purchase. Digital access has been granted!</p>
            <div className="flex items-center justify-center text-green-600 mb-4">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Content now available in your library</span>
            </div>
            <p className="text-sm text-gray-500">Redirecting to home page...</p>
          </div>
        </div>
      )}

      {/* Payment Cancel Modal */}
      {showPaymentCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled</h2>
            <p className="text-gray-600 mb-4">Your payment was cancelled. No charges were made.</p>
            <p className="text-sm text-gray-500">Redirecting to home page...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;