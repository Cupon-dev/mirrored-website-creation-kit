
import { useState } from "react";
import { Search, ShoppingBag, Heart, Filter, Star, Home, Compass, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState(0);

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = () => {
    setCartItems(prev => prev + 1);
  };

  const categories = [
    { name: "All", active: true },
    { name: "Clothing", icon: "👕" },
    { name: "Bag", icon: "👜" },
    { name: "Lamp", icon: "💡" },
    { name: "Wallets", icon: "👛" }
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Roadstar Men Self Fit T-shirt",
      price: 130,
      originalPrice: 150,
      discount: 12,
      rating: 4.6,
      reviews: 124,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      inStock: 32
    },
    {
      id: 2,
      name: "Levis Neck Half Sleeve Tsh",
      price: 150,
      originalPrice: 175,
      discount: 8,
      rating: 4.8,
      reviews: 326,
      image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop",
      inStock: 127
    },
    {
      id: 3,
      name: "Premium Cotton Casual Wear",
      price: 88,
      originalPrice: 110,
      discount: 12,
      rating: 4.5,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1603252109360-909baaf261c7?w=400&h=400&fit=crop",
      inStock: 15
    },
    {
      id: 4,
      name: "Urban Style Light Tee",
      price: 95,
      originalPrice: 120,
      discount: 8,
      rating: 4.7,
      reviews: 201,
      image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop",
      inStock: 43
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-lime-400 to-green-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Welcome Back</p>
              <p className="font-semibold text-gray-900">Siren.uix 👋</p>
            </div>
          </div>
          <div className="relative">
            <ShoppingBag className="w-6 h-6 text-gray-600" />
            {cartItems > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="max-w-6xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="What's on your list?" 
            className="pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:border-lime-400"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-lime-200 to-green-300 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Good Regulation</h2>
            <p className="text-gray-700 mb-4">For Jan 2025</p>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-4xl font-bold text-red-500">50</span>
              <div className="text-sm">
                <span className="text-gray-600">% OFF</span>
              </div>
            </div>
            <Button className="bg-white text-gray-800 hover:bg-gray-100 font-medium px-6">
              🛍️ Shop Now
            </Button>
          </div>
          <div className="absolute right-4 top-4 w-32 h-32 opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop"
              alt="Featured Product"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            <Button variant="ghost" size="sm">•••</Button>
          </div>
          <div className="flex space-x-3">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={category.active ? "default" : "outline"}
                className={`rounded-full px-4 py-2 ${
                  category.active 
                    ? "bg-lime-400 text-gray-800 hover:bg-lime-500" 
                    : "border-gray-200 hover:border-lime-400"
                }`}
              >
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Men's Fashion</h3>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="rounded-lg">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg">
              Ratings
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg">
              Size
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg">
              Color
            </Button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-red-500 text-white rounded-lg px-2 py-1">
                    -{product.discount}%
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white"
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      wishlist.includes(product.id) 
                        ? "fill-red-500 text-red-500" 
                        : "text-gray-400"
                    }`}
                  />
                </Button>
              </div>
              <div className="p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 mb-2 p-0 h-auto"
                >
                  ❤️ Wishlist
                </Button>
                <p className="text-xs text-gray-500 mb-1">{product.inStock} Stocks Left</p>
                <div className="flex items-center space-x-1 mb-2">
                  <span className="text-xs">H&M</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating}</span>
                  <span className="text-xs text-gray-500">({product.reviews})</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-3 leading-tight">
                  {product.name}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900">${product.price}</span>
                    <span className="text-xs text-gray-500 line-through">${product.originalPrice}</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-lime-400 text-gray-800 hover:bg-lime-500 rounded-lg px-3"
                    onClick={addToCart}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Floating Action */}
        {cartItems > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-lime-400 text-gray-800 px-6 py-3 rounded-full shadow-lg flex items-center space-x-3 z-50">
            <span className="font-medium">View your cart</span>
            <Badge className="bg-white text-gray-800 rounded-full">
              {cartItems}x
            </Badge>
            <span className="font-bold">$88.79</span>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-around">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 py-2">
            <Home className="w-5 h-5 text-gray-800" />
            <span className="text-xs text-gray-800 font-medium">Home</span>
            <div className="w-8 h-1 bg-gray-800 rounded-full"></div>
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
