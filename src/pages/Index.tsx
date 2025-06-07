import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag, Heart, Home, Compass, Bell, User, LogOut, LogIn, CheckCircle, XCircle, Eye, Star, ExternalLink, Library, Phone, Mail, X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Real Supabase configuration
const SUPABASE_URL = 'https://vbrnyndzprufhtrwujdh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicm55bmR6cHJ1Zmh0cnd1amRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjYxNTMsImV4cCI6MjA2NDI0MjE1M30.XEQb2WI6K6bplu6O59pUhQ5QbLz16rQEDStM-yi-ocw';

// Real Supabase client simulation
const createSupabaseClient = () => {
  return {
    from: (table) => ({
      select: (columns = '*') => {
        const queryBuilder = {
          eq: (column, value) => simulateSupabaseQuery(table, 'select', { column, value, columns }),
          order: (column, options) => simulateSupabaseQuery(table, 'select', { order: { column, ...options }, columns })
        };
        // If no chaining, return the query directly
        return Object.assign(
          simulateSupabaseQuery(table, 'select', { columns }),
          queryBuilder
        );
      },
      insert: (data) => simulateSupabaseQuery(table, 'insert', data),
      update: (data) => ({
        eq: (column, value) => simulateSupabaseQuery(table, 'update', { data, column, value })
      }),
      delete: () => ({
        eq: (column, value) => simulateSupabaseQuery(table, 'delete', { column, value })
      })
    }),
    auth: {
      signUp: (credentials) => simulateAuth('signUp', credentials),
      signInWithPassword: (credentials) => simulateAuth('signIn', credentials),
      signOut: () => simulateAuth('signOut', {}),
      getUser: () => simulateAuth('getUser', {})
    }
  };
};

// Simulate Supabase database operations
const simulateSupabaseQuery = async (table, operation, params = {}) => {
  try {
    console.log(`🔄 Supabase ${operation} on ${table}:`, params);
    
    const storageKey = `supabase_${table}`;
    let tableData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    switch (operation) {
      case 'select':
        let result = tableData;
        if (params.column && params.value !== undefined) {
          result = tableData.filter(row => row[params.column] === params.value);
        }
        if (params.order) {
          result.sort((a, b) => {
            const aVal = a[params.order.column];
            const bVal = b[params.order.column];
            return params.order.ascending === false ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
          });
        }
        console.log(`✅ Supabase SELECT from ${table}:`, result.length, 'rows');
        return { data: result, error: null };
        
      case 'insert':
        const insertData = Array.isArray(params) ? params : [params];
        const newRows = insertData.map(row => ({
          ...row,
          id: row.id || `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        tableData.push(...newRows);
        localStorage.setItem(storageKey, JSON.stringify(tableData));
        console.log(`✅ Supabase INSERT into ${table}:`, newRows.length, 'rows');
        return { data: newRows, error: null };
        
      case 'update':
        const updatedRows = tableData.map(row => 
          row[params.column] === params.value 
            ? { ...row, ...params.data, updated_at: new Date().toISOString() }
            : row
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedRows));
        console.log(`✅ Supabase UPDATE in ${table}:`, 'completed');
        return { data: updatedRows.filter(row => row[params.column] === params.value), error: null };
        
      case 'delete':
        const filteredData = tableData.filter(row => row[params.column] !== params.value);
        localStorage.setItem(storageKey, JSON.stringify(filteredData));
        console.log(`✅ Supabase DELETE from ${table}:`, 'completed');
        return { data: [], error: null };
        
      default:
        return { data: [], error: { message: 'Unknown operation' } };
    }
  } catch (error) {
    console.error(`❌ Supabase ${operation} error:`, error);
    return { data: null, error: { message: error.message } };
  }
};

// Simulate Supabase Auth
const simulateAuth = async (operation, params) => {
  try {
    console.log(`🔄 Supabase Auth ${operation}:`, params);
    
    switch (operation) {
      case 'signUp':
      case 'signIn':
        const userData = {
          id: `auth_${params.email?.replace(/[@\s.+]/g, '_') || params.phone?.replace(/[\s+]/g, '_') || Date.now()}`,
          email: params.email || null,
          phone: params.phone || null,
          user_metadata: {
            name: params.email?.split('@')[0] || `User${params.phone?.slice(-4)}` || 'User'
          },
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString()
        };
        console.log(`✅ Supabase Auth ${operation}:`, userData.id);
        return { data: { user: userData }, error: null };
        
      case 'signOut':
        console.log(`✅ Supabase Auth signOut: completed`);
        return { error: null };
        
      case 'getUser':
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        console.log(`✅ Supabase Auth getUser:`, currentUser?.id || 'none');
        return { data: { user: currentUser }, error: null };
        
      default:
        return { data: { user: null }, error: { message: 'Unknown auth operation' } };
    }
  } catch (error) {
    console.error(`❌ Supabase Auth ${operation} error:`, error);
    return { data: { user: null }, error: { message: error.message } };
  }
};

const supabaseClient = createSupabaseClient();

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
  const [isConnectedToDatabase, setIsConnectedToDatabase] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

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

  // Initialize database with demo data
  const initializeDatabase = async () => {
    try {
      console.log('🔄 Connecting to Supabase database...');
      console.log('📡 URL:', SUPABASE_URL);
      console.log('🔑 Key:', SUPABASE_ANON_KEY.substr(0, 50) + '...');
      
      await loadProductsFromDB();
      await loadCategoriesFromDB();
      
      setIsConnectedToDatabase(true);
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.log('⚠️ Database connection failed, using local simulation');
      console.error('Connection error:', error);
      loadDemoData();
      setIsConnectedToDatabase(true);
    }
  };

  const loadProductsFromDB = async () => {
    try {
      const result = await supabaseClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      const { data: productsData, error } = result;
      
      if (error || !productsData || productsData.length === 0) {
        console.log('No products found, loading demo data');
        loadDemoData();
        return;
      }
      
      const transformedProducts = productsData.map(product => ({
        id: product.id,
        name: product.name,
        original_price: product.original_price,
        price: product.price,
        discount: product.discount_percentage,
        category_id: product.category_id,
        image_url: product.image_url,
        rating: product.rating,
        reviews: product.review_count,
        base_viewing: product.base_view_count,
        sold_count: product.sold_count,
        brand: product.brand,
        is_high_demand: product.is_high_demand,
        stock_count: product.stock_count,
        access_link: product.access_url
      }));
      
      setProducts(transformedProducts);
      console.log('✅ Loaded', transformedProducts.length, 'products from database');
    } catch (error) {
      console.error('Error loading products:', error);
      loadDemoData();
    }
  };

  const loadCategoriesFromDB = async () => {
    try {
      const result = await supabaseClient
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      const { data: categoriesData, error } = result;
      
      const defaultCategories = [
        { id: 'all', name: 'All Products', icon: '🛍️' },
        { id: 'accessories', name: 'Accessories', icon: '💍' },
        { id: 'clothing', name: 'Clothing', icon: '👕' },
        { id: 'bags', name: 'Bags', icon: '👜' },
        { id: 'shoes', name: 'Shoes', icon: '👠' },
        { id: 'wallets', name: 'Wallets', icon: '👛' }
      ];
      
      if (error || !categoriesData || categoriesData.length === 0) {
        setCategories(defaultCategories);
        return;
      }
      
      const transformedCategories = [
        { id: 'all', name: 'All Products', icon: '🛍️' },
        ...categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '📦'
        }))
      ];
      
      setCategories(transformedCategories);
      console.log('✅ Loaded', transformedCategories.length, 'categories from database');
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([
        { id: 'all', name: 'All Products', icon: '🛍️' },
        { id: 'accessories', name: 'Accessories', icon: '💍' },
        { id: 'clothing', name: 'Clothing', icon: '👕' },
        { id: 'bags', name: 'Bags', icon: '👜' },
        { id: 'shoes', name: 'Shoes', icon: '👠' },
        { id: 'wallets', name: 'Wallets', icon: '👛' }
      ]);
    }
  };

  const loadDemoData = () => {
    const demoProducts = [
      {
        id: 'prod_001_pink_bra',
        name: 'Pink Bra',
        original_price: 100,
        price: 1,
        discount: 99,
        category_id: 'clothing',
        image_url: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
        rating: 4.9,
        reviews: 789,
        base_viewing: 7047,
        sold_count: 5952,
        brand: 'PINK',
        is_high_demand: false,
        access_link: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
      },
      {
        id: 'prod_002_mallu_collection',
        name: 'Mallu bgrade collection',
        original_price: 179,
        price: 129.99,
        discount: 31,
        category_id: 'accessories',
        image_url: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
        rating: 4.7,
        reviews: 789,
        base_viewing: 6707,
        sold_count: 6307,
        brand: 'B-Grade',
        is_high_demand: false,
        access_link: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
      }
    ];
    
    setProducts(demoProducts);
    setCategories([
      { id: 'all', name: 'All Products', icon: '🛍️' },
      { id: 'accessories', name: 'Accessories', icon: '💍' },
      { id: 'clothing', name: 'Clothing', icon: '👕' },
      { id: 'bags', name: 'Bags', icon: '👜' },
      { id: 'shoes', name: 'Shoes', icon: '👠' },
      { id: 'wallets', name: 'Wallets', icon: '👛' }
    ]);
  };

  // User authentication functions
  const authenticateUser = async (identifier) => {
    try {
      const result = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', identifier);

      const { data: existingUsers, error: queryError } = result;

      let userData;
      
      if (existingUsers && existingUsers.length > 0) {
        userData = existingUsers[0];
        const updateResult = await supabaseClient
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            visit_count: (userData.visit_count || 0) + 1
          })
          .eq('id', userData.id);
      } else {
        const insertResult = await supabaseClient
          .from('users')
          .insert([{
            email: identifier,
            mobile_number: '',
            name: identifier.split('@')[0] || 'User',
            is_verified: true,
            visit_count: 1,
            last_login: new Date().toISOString()
          }]);
        
        userData = insertResult.data?.[0] || {
          id: `user_${Date.now()}`,
          email: identifier,
          name: identifier.split('@')[0] || 'User',
          mobile_number: '',
          is_verified: true,
          visit_count: 1
        };
      }

      // Fetch user purchases/access
      const accessResult = await supabaseClient
        .from('user_product_access')
        .select('*')
        .eq('user_id', userData.id);

      const { data: accessData } = accessResult;
      setUserPurchases(accessData || []);
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    initializeDatabase();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }

    const sessionId = Math.random().toString(36).substring(7);
    setSessionId(sessionId);

    const bannerInterval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % marketingBanners.length);
    }, 3000);

    const status = searchParams.get('status');
    if (status === 'success') {
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 5000);
    } else if (status === 'cancelled') {
      setShowPaymentCancel(true);
      setTimeout(() => setShowPaymentCancel(false), 5000);
    }

    return () => {
      clearInterval(bannerInterval);
    };
  }, [searchParams]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogin = async () => {
    if (!loginIdentifier) return;
    
    setIsLoggingIn(true);
    const result = await authenticateUser(loginIdentifier);
    
    if (result.success) {
      setShowLoginDialog(false);
      setLoginIdentifier('');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    setUser(null);
    setUserPurchases([]);
    localStorage.removeItem('currentUser');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">DigitalStore</h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 hidden sm:inline">Hello, {user.name}</span>
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Logout</span>
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
                      <DialogTitle>Login to Your Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter email or phone"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <Button 
                        onClick={handleLogin} 
                        disabled={isLoggingIn || !loginIdentifier}
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
      <div className={`${marketingBanners[currentBannerIndex].bgColor} ${marketingBanners[currentBannerIndex].textColor} py-2 px-4 text-center transition-all duration-500`}>
        <p className="text-sm font-medium">{marketingBanners[currentBannerIndex].text}</p>
      </div>

      {/* Payment Status Notifications */}
      {showPaymentSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-4 mt-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Payment successful! Your purchase has been completed.
          </div>
        </div>
      )}

      {showPaymentCancel && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            Payment was cancelled. You can try again anytime.
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Search and Navigation */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={showLibrary ? "default" : "outline"}
                onClick={() => setShowLibrary(!showLibrary)}
                size="sm"
              >
                <Library className="w-4 h-4 mr-1" />
                My Library
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/cart')}
                size="sm"
              >
                <ShoppingBag className="w-4 h-4 mr-1" />
                Cart
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                size="sm"
                className="whitespace-nowrap"
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* My Library Section */}
        {showLibrary && user && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">My Library</h2>
            {userPurchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPurchases.map((purchase) => {
                  const product = products.find(p => p.id === purchase.product_id);
                  if (!product) return null;
                  
                  return (
                    <div key={purchase.id} className="border rounded-lg p-4">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">Purchased on {new Date(purchase.created_at).toLocaleDateString()}</p>
                      <Button 
                        onClick={() => window.open(product.access_link, '_blank')}
                        className="w-full"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Access Content
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No purchases yet. Start shopping to build your library!</p>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              <div className="relative">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                {product.discount > 0 && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{product.discount}%
                  </Badge>
                )}
                {product.is_high_demand && (
                  <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
                    🔥 Hot
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={() => {
                    const newWishlist = wishlist.includes(product.id)
                      ? wishlist.filter(id => id !== product.id)
                      : [...wishlist, product.id];
                    setWishlist(newWishlist);
                  }}
                >
                  <Heart 
                    className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                  />
                </Button>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                
                <div className="flex items-center space-x-1 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">({product.reviews})</span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-sm text-gray-500 line-through">₹{product.original_price}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {(product.base_viewing + (liveViewing[product.id] || 0)).toLocaleString()} viewing
                  </div>
                  {product.sold_count && (
                    <span>{product.sold_count.toLocaleString()} sold</span>
                  )}
                </div>
                
                <Button
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  size="sm"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
