
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, Home, Library, Bell, User, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccess } from "@/hooks/useUserAccess";
import FlashOfferBanner from "@/components/FlashOfferBanner";
import ProductCard from "@/components/ProductCard";

const Index = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'home' | 'library'>('home');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts(selectedCategory === 'all' ? undefined : selectedCategory);
  const { addToCart, cartCount } = useCart();
  const { user, logout, loginUser } = useAuth();
  const { userAccess, hasAccess } = useUserAccess();

  // Filter products for library view
  const ownedProducts = products.filter(product => user && hasAccess(product.id));

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

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePurchase = (productId: string) => {
    addToCart({ productId });
    navigate('/cart');
  };

  const handleAddToCart = (productId: string) => {
    addToCart({ productId });
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

  const displayProducts = currentView === 'library' ? ownedProducts : products;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs md:text-sm">P</span>
            </div>
            <div className="hidden sm:block">
              {user ? (
                <>
                  <p className="text-xs text-gray-500">Welcome back, {user.name}</p>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">
                    {currentView === 'library' ? 'Your Library 📚' : 'PremiumLeaks Store 🔥'}
                  </p>
                </>
              ) : (
                <p className="font-semibold text-gray-900 text-sm md:text-base">PremiumLeaks Store 🔥</p>
              )}
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
            
            {user ? (
              <Button
                variant="ghost"
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </Button>
            ) : (
              <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Login"
                  >
                    <LogIn className="w-5 h-5 text-gray-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Quick Login</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter your email or mobile number"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full"
                    />
                    <Button 
                      onClick={handleLogin}
                      disabled={isLoggingIn || !loginIdentifier.trim()}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      {isLoggingIn ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      New user? Register during your first purchase!
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Login Helper Message */}
      {!user && currentView === 'home' && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-blue-700">
              💡 <strong>Returning user?</strong> Click the login icon above and enter your email or mobile number to access your purchased products instantly!
            </p>
          </div>
        </div>
      )}

      {/* Search Bar - Only show in home view */}
      {currentView === 'home' && (
        <div className="px-4 py-3 md:py-4 bg-white border-b">
          <div className="max-w-7xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <Input 
              placeholder="Find your next digital treasure..." 
              className="pl-10 pr-4 py-2 md:py-3 rounded-xl border-gray-200 focus:border-green-400 text-sm md:text-base transition-all"
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Flash Offer Banner - Only show in home view */}
        {currentView === 'home' && <FlashOfferBanner />}

        {/* Library View */}
        {currentView === 'library' && (
          <div className="mb-6">
            {user ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Your Digital Library</h2>
                  <Badge className="bg-green-100 text-green-800">
                    {ownedProducts.length} {ownedProducts.length === 1 ? 'Product' : 'Products'}
                  </Badge>
                </div>
                {ownedProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your library is empty</h3>
                    <p className="text-gray-500 mb-4">Start shopping to add products to your library!</p>
                    <Button 
                      onClick={() => setCurrentView('home')}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Please log in</h3>
                <p className="text-gray-500 mb-4">Log in to view your digital library</p>
                <Button 
                  onClick={() => setShowLoginDialog(true)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Login
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Categories - Only show in home view */}
        {currentView === 'home' && (
          <div className="mb-4 md:mb-6">
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
        )}

        {/* Product Grid */}
        {displayProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-8">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onPurchase={handlePurchase}
                onWishlistToggle={toggleWishlist}
                isWishlisted={wishlist.includes(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-around">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all ${
              currentView === 'home' ? 'text-gray-800' : 'text-gray-400'
            }`}
            onClick={() => setCurrentView('home')}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
            {currentView === 'home' && <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>}
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all ${
              currentView === 'library' ? 'text-gray-800' : 'text-gray-400'
            }`}
            onClick={() => setCurrentView('library')}
          >
            <Library className="w-5 h-5" />
            <span className="text-xs font-medium">Library</span>
            {currentView === 'library' && <div className="w-6 h-0.5 bg-gray-800 rounded-full"></div>}
          </Button>
          
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Updates</span>
          </Button>
          
          {user ? (
            <Button 
              variant="ghost" 
              className="flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400">Logout</span>
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              className="flex flex-col items-center space-y-1 py-2 active:scale-95 transition-all"
              onClick={() => setShowLoginDialog(true)}
            >
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400">Login</span>
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Index;
