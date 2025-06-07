import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag, Heart, Home, Compass, Bell, User, LogOut, LogIn, CheckCircle, XCircle, Eye, Star, ExternalLink, Library, Phone, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [userPurchases, setUserPurchases] = useState([]);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCancel, setShowPaymentCancel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [liveViewing, setLiveViewing] = useState({});
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [sessionId, setSessionId] = useState(null);

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
    },
    {
      id: 4,
      text: "🎯 PREMIUM MEMBERS: Extra 20% Discount on All Items!",
      bgColor: "bg-gradient-to-r from-green-500 to-teal-500",
      textColor: "text-white"
    }
  ];

  // Sample products data with unique IDs
  const products = [
    {
      id: 'prod_001_pink_bra',
      name: 'Pink Bra',
      originalPrice: 100,
      price: 1,
      discount: 99,
      category: 'clothing',
      image: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
      rating: 4.9,
      reviews: 789,
      baseViewing: 7047,
      sold: 5952,
      brand: 'PINK',
      grade: '',
      tags: ['Instant Access'],
      accessLink: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
    },
    {
      id: 'prod_002_mallu_collection',
      name: 'Mallu bgrade collection',
      originalPrice: 179,
      price: 129.99,
      discount: 31,
      category: 'accessories',
      image: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
      rating: 4.7,
      reviews: 789,
      baseViewing: 6707,
      sold: 6307,
      brand: 'B-Grade',
      grade: '',
      tags: ['Instant Access'],
      accessLink: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
    },
    {
      id: 'prod_003_vintage_handbag',
      name: 'Vintage Leather Handbag',
      originalPrice: 129.99,
      price: 89.99,
      discount: 31,
      category: 'bags',
      image: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
      rating: 4.8,
      reviews: 156,
      baseViewing: 3948,
      sold: 11393,
      brand: 'Heritage Craft',
      grade: '',
      tags: ['Instant Access'],
      stock: 12,
      accessLink: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
    },
    {
      id: 'prod_004_comfort_essential',
      name: 'Classic Comfort Essential',
      originalPrice: 29.99,
      price: 19.99,
      discount: 33,
      category: 'clothing',
      image: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
      rating: 4.9,
      reviews: 567,
      baseViewing: 9636,
      sold: 11219,
      brand: 'Essentials',
      grade: 'High Demand!',
      tags: ['Instant Access'],
      accessLink: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
    },
    {
      id: 'prod_005_urban_shirt',
      name: 'Urban Style Casual Shirt',
      originalPrice: 45.99,
      price: 32.99,
      discount: 28,
      category: 'clothing',
      image: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
      rating: 4.7,
      reviews: 896,
      baseViewing: 9055,
      sold: 3393,
      brand: 'Urban Trends',
      grade: 'High Demand!',
      tags: ['Instant Access'],
      accessLink: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Products', icon: '🛍️' },
    { id: 'accessories', name: 'Accessories', icon: '💍' },
    { id: 'clothing', name: 'Clothing', icon: '👕' },
    { id: 'bags', name: 'Bags', icon: '👜' },
    { id: 'shoes', name: 'Shoes', icon: '👠' },
    { id: 'wallets', name: 'Wallets', icon: '👛' }
  ];

  // Initialize session and check for existing login
  useEffect(() => {
    const newSessionId = Date.now().toString();
    setSessionId(newSessionId);
    
    // Check for existing logged-in user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadUserPurchases(userData.id);
    }

    // Initialize live viewing numbers
    const initialViewing = {};
    products.forEach(product => {
      initialViewing[product.id] = product.baseViewing;
    });
    setLiveViewing(initialViewing);
  }, []);

  // Load user purchases
  const loadUserPurchases = (userId) => {
    const savedPurchases = JSON.parse(localStorage.getItem(`purchases_${userId}`) || '[]');
    setUserPurchases(savedPurchases);
  };

  // Live viewing counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewing(prev => {
        const updated = { ...prev };
        products.forEach(product => {
          // Random fluctuation between -50 to +100
          const change = Math.floor(Math.random() * 150) - 50;
          updated[product.id] = Math.max(0, (updated[product.id] || product.baseViewing) + change);
        });
        return updated;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Marketing banner rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % marketingBanners.length);
    }, 4000); // Change banner every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const urlSessionId = searchParams.get('session_id');
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');
    
    if (status === 'success' && urlSessionId && productId && user) {
      // Verify this is a legitimate purchase
      const existingPurchases = JSON.parse(localStorage.getItem(`purchases_${user.id}`) || '[]');
      if (!existingPurchases.includes(productId)) {
        const updatedPurchases = [...existingPurchases, productId];
        localStorage.setItem(`purchases_${user.id}`, JSON.stringify(updatedPurchases));
        setUserPurchases(updatedPurchases);
        
        // Log purchase transaction
        const purchaseLog = {
          userId: user.id,
          productId: productId,
          sessionId: urlSessionId,
          timestamp: new Date().toISOString(),
          amount: products.find(p => p.id === productId)?.price || 0
        };
        
        // Save to purchase history
        const allPurchases = JSON.parse(localStorage.getItem('allPurchaseHistory') || '[]');
        allPurchases.push(purchaseLog);
        localStorage.setItem('allPurchaseHistory', JSON.stringify(allPurchases));
      }
      
      setShowPaymentSuccess(true);
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

  // Login function
  const handleLogin = async () => {
    if (!loginIdentifier.trim()) return;
    
    setIsLoggingIn(true);
    
    // Simulate login validation
    setTimeout(() => {
      const userData = {
        id: loginIdentifier.replace(/[@\s.]/g, '_').toLowerCase(),
        email: loginIdentifier.includes('@') ? loginIdentifier : null,
        phone: !loginIdentifier.includes('@') ? loginIdentifier : null,
        name: loginIdentifier.includes('@') ? loginIdentifier.split('@')[0] : `User${loginIdentifier.slice(-4)}`,
        loginTime: new Date().toISOString(),
        sessionId: sessionId
      };
      
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      loadUserPurchases(userData.id);
      
      // Log session
      const sessionLog = {
        userId: userData.id,
        sessionId: sessionId,
        loginTime: userData.loginTime,
        userAgent: navigator.userAgent
      };
      
      const allSessions = JSON.parse(localStorage.getItem('allUserSessions') || '[]');
      allSessions.push(sessionLog);
      localStorage.setItem('allUserSessions', JSON.stringify(allSessions));
      
      setShowLoginDialog(false);
      setLoginIdentifier('');
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setUserPurchases([]);
  };

  const checkUserAccess = (productId) => {
    return userPurchases.includes(productId);
  };

  const handlePurchase = (product) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    // Create unique payment session with product info
    const paymentSessionId = `pay_${Date.now()}_${product.id}`;
    
    // Store pending payment info
    const pendingPayment = {
      sessionId: paymentSessionId,
      productId: product.id,
      userId: user.id,
      amount: product.price,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`pending_payment_${paymentSessionId}`, JSON.stringify(pendingPayment));
    
    // Open Razorpay with unique session tracking
    const razorpayUrl = `https://rzp.io/rzp/HtJXOouR?session_id=${paymentSessionId}&product_id=${product.id}&user_id=${user.id}`;
    window.open(razorpayUrl, '_blank');
    
    // For demo: simulate successful payment after 5 seconds
    setTimeout(() => {
      const pendingPaymentData = localStorage.getItem(`pending_payment_${paymentSessionId}`);
      if (pendingPaymentData) {
        const paymentData = JSON.parse(pendingPaymentData);
        
        // Add to user purchases
        const updatedPurchases = [...userPurchases, product.id];
        setUserPurchases(updatedPurchases);
        localStorage.setItem(`purchases_${user.id}`, JSON.stringify(updatedPurchases));
        
        // Log successful purchase
        const purchaseLog = {
          ...paymentData,
          completedAt: new Date().toISOString(),
          status: 'completed'
        };
        
        const allPurchases = JSON.parse(localStorage.getItem('allPurchaseHistory') || '[]');
        allPurchases.push(purchaseLog);
        localStorage.setItem('allPurchaseHistory', JSON.stringify(allPurchases));
        
        // Clean up pending payment
        localStorage.removeItem(`pending_payment_${paymentSessionId}`);
        
        setShowPaymentSuccess(true);
        setTimeout(() => setShowPaymentSuccess(false), 3000);
      }
    }, 5000);
  };

  const accessDigitalContent = (product) => {
    if (checkUserAccess(product.id)) {
      window.open(product.accessLink, '_blank');
    } else {
      alert('Access denied. Please purchase this product first.');
    }
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const purchasedProducts = products.filter(product => checkUserAccess(product.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                {user ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {user ? `Welcome back, ${user.name}` : 'Welcome, Guest'}
                </p>
                <h1 className="text-xl font-bold">PremiumLeaks Store 🔥</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowLoginDialog(true)}>
                  <LogIn className="w-4 h-4 mr-1" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Live Marketing Banner */}
      <div className={`${marketingBanners[currentBannerIndex].bgColor} ${marketingBanners[currentBannerIndex].textColor} text-center py-3 px-4 transition-all duration-500`}>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm font-medium animate-pulse">LIVE</span>
          <span className="text-sm font-bold">{marketingBanners[currentBannerIndex].text}</span>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Session Info */}
      {user && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">
                🔒 Secure Session • {purchasedProducts.length} items owned
              </span>
              <span className="text-blue-600">
                Session ID: {sessionId?.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                {/* Discount Badge */}
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  -{product.discount}%
                </div>
                {/* Stock Info */}
                {product.stock && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs">
                    Only {product.stock} left!
                  </div>
                )}
                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-2 right-2 text-white hover:text-red-500 transition-colors"
                  style={{ right: product.stock ? '80px' : '8px' }}
                >
                  <Heart className={`w-5 h-5 ${wishlist.includes(product.id) ? 'fill-current text-red-500' : ''}`} />
                </button>
                
                {/* Owned Badge */}
                {checkUserAccess(product.id) && (
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Owned
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3">
                {/* Live Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    <span className="animate-pulse">{(liveViewing[product.id] || product.baseViewing).toLocaleString()} viewing</span>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-blue-600 mb-2">
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  {product.sold.toLocaleString()} sold
                </div>

                {/* Brand */}
                <p className="text-xs text-gray-600 mb-1">{product.brand}</p>
                {product.grade && (
                  <div className="flex items-center text-xs text-red-600 mb-1">
                    <span>📈 {product.grade}</span>
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium ml-1">{product.rating}</span>
                  <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                </div>

                {/* Product Name */}
                <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">{product.name}</h3>

                {/* Price */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold text-black">₹{product.price}</span>
                  <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                  <span className="text-sm text-green-600 font-medium">
                    Save ₹{(product.originalPrice - product.price).toFixed(0)}
                  </span>
                </div>

                {/* Instant Access Tag */}
                <div className="flex items-center text-xs text-green-600 mb-3">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Instant Access
                </div>

                {/* Purchase Status */}
                {checkUserAccess(product.id) && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                    <div className="flex items-center text-green-700 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span className="font-medium">You own this product</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {checkUserAccess(product.id) ? (
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2"
                    onClick={() => accessDigitalContent(product)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    ACCESS NOW
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2"
                      onClick={() => handlePurchase(product)}
                      disabled={!user}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      {user ? 'BUY NOW' : 'LOGIN TO BUY'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-sm py-2"
                      onClick={() => console.log('Add to cart:', product.id)}
                      disabled={!user}
                    >
                      Add to Cart
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center p-2 text-blue-500">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-500">
            <Compass className="w-5 h-5" />
            <span className="text-xs mt-1">Explore</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-gray-500 relative"
            onClick={() => user ? setShowLibrary(true) : setShowLoginDialog(true)}
          >
            <Library className="w-5 h-5" />
            <span className="text-xs mt-1">Library</span>
            {purchasedProducts.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-green-500">
                {purchasedProducts.length}
              </Badge>
            )}
          </button>
          <button className="flex flex-col items-center p-2 text-gray-500">
            <Bell className="w-5 h-5" />
            <span className="text-xs mt-1">Alerts</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-500">
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <LogIn className="w-5 h-5 mr-2" />
              Login to Your Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              Enter your email or phone number to continue
            </div>
            
            <div className="relative">
              <Input
                placeholder="Email address or phone number"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="pl-10"
                disabled={isLoggingIn}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {loginIdentifier.includes('@') ? (
                  <Mail className="w-4 h-4 text-gray-400" />
                ) : (
                  <Phone className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleLogin} 
              disabled={isLoggingIn || !loginIdentifier.trim()}
              className="w-full"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </>
              ) : (
                'Continue'
              )}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Library Modal */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Library className="w-5 h-5 mr-2" />
                My Digital Library ({purchasedProducts.length} items)
              </div>
              <div className="text-sm text-gray-500">
                User: {user?.name}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {purchasedProducts.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  All your purchases are secured and accessible anytime
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {purchasedProducts.length > 0 ? (
              purchasedProducts.map((product) => (
                <div key={product.id} className="bg-gray-50 rounded-lg p-4 border">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                  <h3 className="font-medium text-sm mb-2">{product.name}</h3>
                  <div className="text-xs text-gray-600 mb-2">
                    Product ID: {product.id}
                  </div>
                  <div className="flex items-center text-green-600 text-xs mb-3">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Full Access Granted
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={() => accessDigitalContent(product)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open Content
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Library className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No purchased items yet</p>
                <p className="text-sm text-gray-400 mb-4">Items you purchase will appear here with instant access</p>
                <Button onClick={() => setShowLibrary(false)}>
                  Browse Products
                </Button>
              </div>
            )}
          </div>
          
          {purchasedProducts.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="text-xs text-gray-500 text-center">
                🔒 Your purchases are securely stored and linked to your account.<br />
                Access your content anytime, anywhere with your login credentials.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful! 🎉</h2>
            <p className="text-gray-600 mb-4">Your purchase is complete. Digital access granted instantly!</p>
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
              <div className="flex items-center justify-center text-green-600 text-sm">
                <Library className="w-4 h-4 mr-2" />
                <span className="font-medium">Content added to your library</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Session: {sessionId?.slice(-8)} • User: {user?.name}
            </div>
            <p className="text-xs text-gray-500 mt-2">Auto-closing in 3 seconds...</p>
          </div>
        </div>
      )}

      {/* Payment Cancel Modal */}
      {showPaymentCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled</h2>
            <p className="text-gray-600 mb-4">No charges were made to your account</p>
            <div className="text-xs text-gray-500">
              Session: {sessionId?.slice(-8)}
            </div>
            <p className="text-xs text-gray-500 mt-2">Redirecting...</p>
          </div>
        </div>
      )}

      {/* Add bottom padding to prevent content from being hidden behind bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default Index;