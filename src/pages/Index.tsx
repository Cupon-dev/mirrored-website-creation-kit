import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag, Heart, Home, Compass, Bell, User, LogOut, LogIn, CheckCircle, XCircle, Eye, Star, ExternalLink, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState({ id: 'mani', name: 'Mani' });
  const [userPurchases, setUserPurchases] = useState([]);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCancel, setShowPaymentCancel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  // Sample products data
  const products = [
    {
      id: '1',
      name: 'Pink Bra',
      originalPrice: 100,
      price: 1,
      discount: 99,
      category: 'clothing',
      image: '/api/placeholder/300/200',
      rating: 4.9,
      reviews: 789,
      viewing: 7047,
      sold: 5952,
      brand: 'PINK',
      grade: '',
      tags: ['Instant Access']
    },
    {
      id: '2',
      name: 'Mallu bgrade collection',
      originalPrice: 179,
      price: 129.99,
      discount: 31,
      category: 'accessories',
      image: '/api/placeholder/300/200',
      rating: 4.7,
      reviews: 789,
      viewing: 6707,
      sold: 6307,
      brand: 'B-Grade',
      grade: '',
      tags: ['Instant Access']
    },
    {
      id: '3',
      name: 'Vintage Leather Handbag',
      originalPrice: 129.99,
      price: 89.99,
      discount: 31,
      category: 'bags',
      image: '/api/placeholder/300/200',
      rating: 4.8,
      reviews: 156,
      viewing: 3948,
      sold: 11393,
      brand: 'Heritage Craft',
      grade: '',
      tags: ['Instant Access'],
      stock: 12
    },
    {
      id: '4',
      name: 'Classic Comfort Essential',
      originalPrice: 29.99,
      price: 19.99,
      discount: 33,
      category: 'clothing',
      image: '/api/placeholder/300/200',
      rating: 4.9,
      reviews: 567,
      viewing: 9636,
      sold: 11219,
      brand: 'Essentials',
      grade: 'High Demand!',
      tags: ['Instant Access']
    },
    {
      id: '5',
      name: 'Urban Style Casual Shirt',
      originalPrice: 45.99,
      price: 32.99,
      discount: 28,
      category: 'clothing',
      image: '/api/placeholder/300/200',
      rating: 4.7,
      reviews: 896,
      viewing: 9055,
      sold: 3393,
      brand: 'Urban Trends',
      grade: 'High Demand!',
      tags: ['Instant Access']
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

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');
    
    if (status === 'success' && sessionId && productId && user) {
      const existingPurchases = JSON.parse(localStorage.getItem(`purchases_${user.id}`) || '[]');
      if (!existingPurchases.includes(productId)) {
        const updatedPurchases = [...existingPurchases, productId];
        localStorage.setItem(`purchases_${user.id}`, JSON.stringify(updatedPurchases));
        setUserPurchases(updatedPurchases);
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

  // Load user purchases when user logs in
  useEffect(() => {
    if (user) {
      const savedPurchases = JSON.parse(localStorage.getItem(`purchases_${user.id}`) || '[]');
      setUserPurchases(savedPurchases);
    }
  }, [user]);

  const checkUserAccess = (productId) => {
    return userPurchases.includes(productId);
  };

  const handlePurchase = (product) => {
    // Redirect to Razorpay payment link
    window.open('https://rzp.io/rzp/HtJXOouR', '_blank');
    
    // Simulate purchase after 3 seconds (for demo)
    setTimeout(() => {
      const updatedPurchases = [...userPurchases, product.id];
      setUserPurchases(updatedPurchases);
      localStorage.setItem(`purchases_${user.id}`, JSON.stringify(updatedPurchases));
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 3000);
    }, 3000);
  };

  const accessDigitalContent = () => {
    window.open('https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link', '_blank');
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
                P
              </div>
              <div>
                <p className="text-sm text-gray-600">Welcome back, Mani</p>
                <h1 className="text-xl font-bold">PremiumLeaks Store 🔥</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {product.viewing.toLocaleString()} viewing
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

                {/* Action Buttons */}
                {checkUserAccess(product.id) ? (
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2"
                    onClick={accessDigitalContent}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    ACCESS NOW
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2"
                      onClick={() => handlePurchase(product)}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      BUY NOW
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-sm py-2"
                      onClick={() => console.log('Add to cart:', product.id)}
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
            className="flex flex-col items-center p-2 text-gray-500"
            onClick={() => setShowLibrary(true)}
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

      {/* Library Modal */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Library className="w-5 h-5 mr-2" />
              My Digital Library ({purchasedProducts.length} items)
            </DialogTitle>
          </DialogHeader>
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
                  <div className="flex items-center text-green-600 text-xs mb-3">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Access Granted
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={accessDigitalContent}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open Content
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Library className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No purchased items yet</p>
                <p className="text-sm text-gray-400">Items you purchase will appear here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful! 🎉</h2>
            <p className="text-gray-600 mb-4">Your purchase is complete. Digital access granted!</p>
            <div className="flex items-center justify-center text-green-600 mb-4">
              <Library className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Content added to your library</span>
            </div>
            <p className="text-xs text-gray-500">Auto-closing in 3 seconds...</p>
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
            <p className="text-xs text-gray-500">Redirecting...</p>
          </div>
        </div>
      )}

      {/* Add bottom padding to prevent content from being hidden behind bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default Index;