
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import FlashOfferBanner from "@/components/FlashOfferBanner";
import ProductCard from "@/components/ProductCard";
import ProfilePage from "@/components/ProfilePage";
import UpdatesPage from "@/components/UpdatesPage";
import IndexHeader from "@/components/IndexHeader";
import IndexLoginHelper from "@/components/IndexLoginHelper";
import IndexSearchBar from "@/components/IndexSearchBar";
import IndexCategoriesSection from "@/components/IndexCategoriesSection";
import IndexLibraryView from "@/components/IndexLibraryView";
import IndexBottomNavigation from "@/components/IndexBottomNavigation";

const Index = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'home' | 'library' | 'profile' | 'updates'>('home');
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts(selectedCategory === 'all' ? undefined : selectedCategory);
  const { addToCart, cartCount } = useCart();
  const { user } = useAuth();
  const { userAccess, hasAccess } = useUserAccess();
  const { toast } = useToast();
  const { unreadCount, markAsRead } = useNotifications();

  // Filter products for library view - only products user actually has access to
  const ownedProducts = products.filter(product => user && hasAccess(product.id));
  
  // Filter products for home view - exclude owned products to avoid showing duplicates
  const availableProducts = currentView === 'home' 
    ? products.filter(product => !user || !hasAccess(product.id))
    : products;

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePurchase = (productId: string) => {
    // Check if user already has access
    if (user && hasAccess(productId)) {
      toast({
        title: "Already Owned! 🎉",
        description: "You already have access to this product. Check your library!",
        variant: "default",
      });
      return;
    }
    
    addToCart({ productId });
    navigate('/cart');
  };

  const handleAddToCart = (productId: string) => {
    // Check if user already has access
    if (user && hasAccess(productId)) {
      toast({
        title: "Already Owned! 🎉",
        description: "You already have access to this product. Check your library!",
        variant: "default",
      });
      return;
    }
    
    addToCart({ productId });
  };

  const handleUpdatesClick = () => {
    markAsRead();
    setCurrentView('updates');
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

  // Show profile page
  if (currentView === 'profile') {
    return <ProfilePage onBack={() => setCurrentView('home')} />;
  }

  // Show updates page
  if (currentView === 'updates') {
    return <UpdatesPage onBack={() => setCurrentView('home')} />;
  }

  const displayProducts = currentView === 'library' ? ownedProducts : availableProducts;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <IndexHeader currentView={currentView} cartCount={cartCount} />
      
      <IndexLoginHelper user={user} currentView={currentView} />
      
      <IndexSearchBar currentView={currentView} />

      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Flash Offer Banner - Only show in home view */}
        {currentView === 'home' && <FlashOfferBanner />}

        <IndexLibraryView 
          currentView={currentView}
          user={user}
          ownedProducts={ownedProducts}
          setCurrentView={setCurrentView}
        />

        <IndexCategoriesSection 
          currentView={currentView}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Product Grid */}
        {displayProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 mb-6">
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

      <IndexBottomNavigation 
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        unreadCount={unreadCount}
        handleUpdatesClick={handleUpdatesClick}
      />
    </div>
  );
};

export default Index;
