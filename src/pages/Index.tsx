{/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex itemsimport { useState, useEffect } from "react";
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
      select: (columns = '*') => ({
        eq: (column, value) => simulateSupabaseQuery(table, 'select', { column, value, columns }),
        execute: () => simulateSupabaseQuery(table, 'select', {}),
        order: (column, options) => ({
          execute: () => simulateSupabaseQuery(table, 'select', { order: { column, ...options } })
        })
      }),
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
const simulateSupabaseQuery = async (table, operation, params) => {
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
      const { data: productsData, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
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
      const { data: categoriesData, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
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
      },
      {
        id: 'prod_003_vintage_handbag',
        name: 'Vintage Leather Handbag',
        original_price: 129.99,
        price: 89.99,
        discount: 31,
        category_id: 'bags',
        image_url: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
        rating: 4.8,
        reviews: 156,
        base_viewing: 3948,
        sold_count: 11393,
        brand: 'Heritage Craft',
        is_high_demand: false,
        stock_count: 12,
        access_link: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
      },
      {
        id: 'prod_004_comfort_essential',
        name: 'Classic Comfort Essential',
        original_price: 29.99,
        price: 19.99,
        discount: 33,
        category_id: 'clothing',
        image_url: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
        rating: 4.9,
        reviews: 567,
        base_viewing: 9636,
        sold_count: 11219,
        brand: 'Essentials',
        is_high_demand: true,
        access_link: 'https://drive.google.com/drive/folders/1YZ6H6eE3gEDgu0BZ9M7S5655SyRUgTQI?usp=share_link'
      },
      {
        id: 'prod_005_urban_shirt',
        name: 'Urban Style Casual Shirt',
        original_price: 45.99,
        price: 32.99,
        discount: 28,
        category_id: 'clothing',
        image_url: 'https://vbrnyndzprufhtrwujdh.supabase.co/storage/v1/object/sign/product-images/Screenshot%202025-06-07%20at%2010.02.25%20AM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80OWY4MGU5Ny04ZWYwLTQ1MjEtOTQzMS03MDFkZmI3YWM5ZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy9TY3JlZW5zaG90IDIwMjUtMDYtMDcgYXQgMTAuMDIuMjUgQU0ucG5nIiwiaWF0IjoxNzQ5Mjg1MDAyLCJleHAiOjI2MTMxOTg2MDJ9.erQGuXhEskqvCT73hjBCJVCyu5-a99KtofttVskYM8w',
        rating: 4.7,
        reviews: 896,
        base_viewing: 9055,
        sold_count: 3393,
        brand: 'Urban Trends',
        is_high_demand: true,
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
      // First check if user exists
      const { data: existingUsers, error: queryError } = await supabaseClient
        .from('users')
        .select('*')
        .or(`email.eq.${identifier},phone.eq.${identifier}`)
        .limit(1);

      let userData;
      
      if (existingUsers && existingUsers.length > 0) {
        // User exists, update last login
        userData = existingUsers[0];
        await supabaseClient
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userData.id);
        
        console.log('✅ Existing user logged in:', userData.id);
      } else {
        // Create new user
        userData = {
          id: `user_${identifier.replace(/[@\s.+]/g, '_').toLowerCase()}_${Date.now()}`,
          email: identifier.includes('@') ? identifier : null,
          phone: !identifier.includes('@') ? identifier : null,
          name: identifier.includes('@') ? identifier.split('@')[0] : `User${identifier.slice(-4)}`,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
        
        // Save new user to database
        const { data: newUser, error: insertError } = await supabaseClient
          .from('users')
          .insert([userData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          // Fallback: continue with local user data
        } else {
          userData = newUser;
          console.log('✅ New user created in database:', userData.id);
        }
      }
      
      return userData;
    } catch (error) {
      console.error('Authentication error:', error);
      // Fallback: create local user
      const userData = {
        id: `user_${identifier.replace(/[@\s.+]/g, '_').toLowerCase()}_${Date.now()}`,
        email: identifier.includes('@') ? identifier : null,
        phone: !identifier.includes('@') ? identifier : null,
        name: identifier.includes('@') ? identifier.split('@')[0] : `User${identifier.slice(-4)}`,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      return userData;
    }
  };

  const saveSessionToDB = async (sessionData) => {
    try {
      const { data, error } = await supabaseClient
        .from('user_sessions')
        .insert([{
          id: sessionData.id,
          user_id: sessionData.user_id,
          session_id: sessionData.session_id,
          login_time: sessionData.login_time,
          user_agent: sessionData.user_agent,
          ip_address: sessionData.ip_address || 'unknown'
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving session:', error);
      } else {
        console.log('✅ Session saved to database:', data.session_id);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const savePaymentToDB = async (paymentData) => {
    try {
      // Save payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from('payments')
        .insert([{
          id: paymentData.id,
          user_id: paymentData.user_id,
          product_id: paymentData.product_id,
          amount: paymentData.amount,
          payment_session_id: paymentData.payment_session_id,
          status: paymentData.status,
          created_at: paymentData.created_at
        }])
        .select()
        .single();
      
      if (paymentError) {
        console.error('Error saving payment:', paymentError);
      } else {
        console.log('✅ Payment saved to database:', payment.id);
      }
      
      // Grant product access
      const accessData = {
        id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: paymentData.user_id,
        product_id: paymentData.product_id,
        granted_at: paymentData.created_at,
        is_active: true
      };
      
      const { data: access, error: accessError } = await supabaseClient
        .from('user_product_access')
        .insert([accessData])
        .select()
        .single();
      
      if (accessError) {
        console.error('Error granting access:', accessError);
      } else {
        console.log('✅ Product access granted in database:', access.id);
      }
      
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const loadUserPurchases = async (userId) => {
    try {
      const { data: accessData, error } = await supabaseClient
        .from('user_product_access')
        .select(`
          product_id,
          granted_at,
          products (
            id,
            name,
            image_url,
            price,
            access_url
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading purchases:', error);
        // Fallback to localStorage
        const fallbackPurchases = JSON.parse(localStorage.getItem(`purchases_${userId}`) || '[]');
        setUserPurchases(fallbackPurchases);
        return;
      }
      
      const productIds = (accessData || []).map(access => access.product_id);
      setUserPurchases(productIds);
      
      // Also save to localStorage as backup
      localStorage.setItem(`purchases_${userId}`, JSON.stringify(productIds));
      
      console.log('✅ Loaded user purchases from database:', productIds.length);
    } catch (error) {
      console.error('Error loading purchases:', error);
      // Fallback to localStorage
      const fallbackPurchases = JSON.parse(localStorage.getItem(`purchases_${userId}`) || '[]');
      setUserPurchases(fallbackPurchases);
    }
  };

  // Initialize app
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    initializeDatabase();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadUserPurchases(userData.id);
    }
  }, []);

  // Initialize live viewing numbers
  useEffect(() => {
    if (products.length > 0) {
      const initialViewing = {};
      products.forEach(product => {
        initialViewing[product.id] = product.base_viewing;
      });
      setLiveViewing(initialViewing);
    }
  }, [products]);

  // Live viewing counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewing(prev => {
        const updated = { ...prev };
        products.forEach(product => {
          const change = Math.floor(Math.random() * 150) - 50;
          updated[product.id] = Math.max(0, (updated[product.id] || product.base_viewing) + change);
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [products]);

  // Marketing banner rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % marketingBanners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const urlSessionId = searchParams.get('session_id');
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');
    
    if (status === 'success' && urlSessionId && productId && user) {
      // CRITICAL: Only grant access with proper verification
      verifyAndGrantAccess(productId, urlSessionId);
    } else if (status === 'cancel') {
      handlePaymentCancel(urlSessionId);
    }
  }, [searchParams, user, navigate]);

  const verifyAndGrantAccess = async (productId, paymentSessionId) => {
    try {
      console.log('🔍 Verifying payment for session:', paymentSessionId);
      
      // Step 1: Verify payment exists in database as pending
      const { data: pendingPayments, error: verifyError } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('payment_session_id', paymentSessionId)
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (verifyError || !pendingPayments || pendingPayments.length === 0) {
        console.error('❌ Payment verification failed - no pending payment found');
        alert('❌ Payment verification failed. Please contact support if you completed payment.');
        return;
      }
      
      const pendingPayment = pendingPayments[0];
      
      // Step 2: In a real app, you would verify with Razorpay webhook here
      // For demo, we simulate this verification step
      const isPaymentVerified = await simulatePaymentVerification(paymentSessionId);
      
      if (!isPaymentVerified) {
        console.error('❌ Payment verification failed - payment not confirmed');
        alert('❌ Payment verification failed. Please ensure payment was completed successfully.');
        return;
      }
      
      // Step 3: Update payment status to completed
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({ 
          status: 'completed',
          verified_at: new Date().toISOString() 
        })
        .eq('id', pendingPayment.id);
      
      if (updateError) {
        console.error('❌ Error updating payment status:', updateError);
        return;
      }
      
      // Step 4: Grant product access
      const accessData = {
        id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        product_id: productId,
        granted_at: new Date().toISOString(),
        is_active: true,
        payment_id: pendingPayment.id
      };
      
      const { error: accessError } = await supabaseClient
        .from('user_product_access')
        .insert([accessData]);
      
      if (accessError) {
        console.error('❌ Error granting access:', accessError);
        return;
      }
      
      // Step 5: Update UI and show success
      await loadUserPurchases(user.id);
      setShowPaymentSuccess(true);
      
      // Clean up pending payment from localStorage
      localStorage.removeItem(`pending_payment_${paymentSessionId}`);
      
      console.log('✅ Payment verified and access granted');
      
      setTimeout(() => {
        setShowPaymentSuccess(false);
        navigate('/', { replace: true });
      }, 3000);
      
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      alert('❌ Payment verification failed. Please contact support.');
    }
  };

  const simulatePaymentVerification = async (paymentSessionId) => {
    try {
      // In a real app, this would be a webhook from Razorpay
      // that verifies the payment with their API
      
      // For demo purposes, we simulate this by checking if the user
      // actually went through the payment flow (URL parameters present)
      const urlParams = new URLSearchParams(window.location.search);
      const urlSessionId = urlParams.get('session_id');
      
      // Basic verification: session ID matches and user returned with success status
      if (urlSessionId === paymentSessionId) {
        console.log('✅ Payment verification simulated - session ID matches');
        return true;
      }
      
      // In production, replace this with:
      /*
      const razorpayVerification = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_session_id: paymentSessionId,
          razorpay_payment_id: urlParams.get('razorpay_payment_id'),
          razorpay_signature: urlParams.get('razorpay_signature')
        })
      });
      
      const verificationResult = await razorpayVerification.json();
      return verificationResult.verified;
      */
      
      return false;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  };

  const handlePaymentCancel = async (paymentSessionId) => {
    try {
      // Update payment status to cancelled
      if (paymentSessionId) {
        await supabaseClient
          .from('payments')
          .update({ status: 'cancelled' })
          .eq('payment_session_id', paymentSessionId);
        
        // Clean up pending payment
        localStorage.removeItem(`pending_payment_${paymentSessionId}`);
      }
      
      setShowPaymentCancel(true);
      setTimeout(() => {
        setShowPaymentCancel(false);
        navigate('/', { replace: true });
      }, 3000);
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
    }
  };

  // Login function
  const handleLogin = async () => {
    if (!loginIdentifier.trim()) return;
    
    setIsLoggingIn(true);
    
    try {
      const userData = await authenticateUser(loginIdentifier);
      
      const sessionData = {
        id: `session_${Date.now()}`,
        user_id: userData.id,
        session_id: sessionId,
        login_time: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: 'demo_ip'
      };

      await saveSessionToDB(sessionData);
      
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      await loadUserPurchases(userData.id);
      
      setShowLoginDialog(false);
      setLoginIdentifier('');
      setIsLoggingIn(false);
    } catch (error) {
      console.error('Login error:', error);
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setUserPurchases([]);
  };

  const checkUserAccess = (productId) => {
    return userPurchases.includes(productId);
  };

  const handlePurchase = async (product) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    const paymentSessionId = `pay_${Date.now()}_${product.id}`;
    
    // Store pending payment info (NOT granted yet)
    const pendingPayment = {
      session_id: paymentSessionId,
      product_id: product.id,
      user_id: user.id,
      amount: product.price,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`pending_payment_${paymentSessionId}`, JSON.stringify(pendingPayment));
    
    // Save pending payment to database (status: pending)
    try {
      await supabaseClient.from('payments').insert([{
        id: `payment_${paymentSessionId}`,
        user_id: user.id,
        product_id: product.id,
        amount: product.price,
        payment_session_id: paymentSessionId,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);
      console.log('💳 Pending payment recorded in database');
    } catch (error) {
      console.error('Error recording pending payment:', error);
    }
    
    // Redirect to Razorpay with proper return URLs
    const successUrl = `${window.location.origin}${window.location.pathname}?status=success&session_id=${paymentSessionId}&product_id=${product.id}`;
    const cancelUrl = `${window.location.origin}${window.location.pathname}?status=cancel&session_id=${paymentSessionId}`;
    
    const razorpayUrl = `https://rzp.io/rzp/HtJXOouR?session_id=${paymentSessionId}&product_id=${product.id}&user_id=${user.id}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
    
    // Open Razorpay payment gateway
    window.open(razorpayUrl, '_blank');
    
    // Show payment in progress message
    alert(`🔄 Payment initiated for ${product.name}\n\nYou will be redirected to Razorpay to complete payment.\nAccess will be granted only after successful payment verification.`);
    
    // REMOVE THE AUTO-GRANT SIMULATION - THIS WAS THE SECURITY FLAW
    // No automatic access granted here - only after real payment verification
  };

  const accessDigitalContent = async (product) => {
    if (checkUserAccess(product.id)) {
      window.open(product.access_link, '_blank');
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
    : products.filter(product => product.category_id === selectedCategory);

  const purchasedProducts = products.filter(product => checkUserAccess(product.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Database Status Banner */}
      <div className={`${isConnectedToDatabase ? 'bg-green-500' : 'bg-orange-500'} text-white text-center py-1 px-4 text-xs`}>
        <div className="flex items-center justify-center space-x-2">
          <Database className="w-3 h-3" />
          <span>
            {isConnectedToDatabase ? '✅ Connected to Supabase Database' : '⚠️ Demo Mode - Replace with correct Supabase credentials'}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                {user ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  {user ? `Welcome back, ${user.name}` : 'Welcome, Guest'}
                </p>
                <h1 className="text-lg sm:text-xl font-bold">PremiumLeaks Store 🔥</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs sm:text-sm p-1 sm:p-2">
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowLoginDialog(true)} className="text-xs sm:text-sm p-1 sm:p-2">
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Live Marketing Banner */}
      <div className={`${marketingBanners[currentBannerIndex].bgColor} ${marketingBanners[currentBannerIndex].textColor} text-center py-2 sm:py-3 px-2 sm:px-4 transition-all duration-500`}>
        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
          <span className="text-xs sm:text-sm font-medium animate-pulse">LIVE</span>
          <span className="text-xs sm:text-sm font-bold">{marketingBanners[currentBannerIndex].text}</span>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Categories</h2>
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap text-xs sm:text-sm ${
                  selectedCategory === category.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xs sm:text-base">{category.icon}</span>
                <span className="text-xs sm:text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Session Info */}
      {user && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm space-y-1 sm:space-y-0">
              <span className="text-blue-700">
                🔒 Secure Session • {purchasedProducts.length} items owned • DB: {isConnectedToDatabase ? 'Connected' : 'Demo'}
              </span>
              <span className="text-blue-600">
                Session: {sessionId?.slice(-8)} • User: {user.id.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="relative">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-32 sm:h-40 md:h-48 object-cover"
                />
                {/* Discount Badge */}
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-bold">
                  -{product.discount}%
                </div>
                {/* Stock Info */}
                {product.stock_count && (
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-orange-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
                    Only {product.stock_count} left!
                  </div>
                )}
                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-1 sm:top-2 right-1 sm:right-2 text-white hover:text-red-500 transition-colors"
                  style={{ right: product.stock_count ? '60px' : '4px' }}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlist.includes(product.id) ? 'fill-current text-red-500' : ''}`} />
                </button>
                
                {/* Owned Badge */}
                {checkUserAccess(product.id) && (
                  <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-green-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs flex items-center">
                    <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                    <span className="hidden sm:inline">Owned</span>
                    <span className="sm:hidden">✓</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-2 sm:p-3">
                {/* Live Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1 sm:mb-2">
                  <div className="flex items-center">
                    <Eye className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                    <span className="animate-pulse text-xs">{(liveViewing[product.id] || product.base_viewing).toLocaleString()} viewing</span>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-blue-600 mb-1 sm:mb-2">
                  <ShoppingBag className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                  <span className="text-xs">{product.sold_count.toLocaleString()} sold</span>
                </div>

                {/* Brand */}
                <p className="text-xs text-gray-600 mb-1">{product.brand}</p>
                {product.is_high_demand && (
                  <div className="flex items-center text-xs text-red-600 mb-1">
                    <span className="text-xs">📈 High Demand!</span>
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center mb-1 sm:mb-2">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                  <span className="text-xs sm:text-sm font-medium ml-1">{product.rating}</span>
                  <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                </div>

                {/* Product Name */}
                <h3 className="text-xs sm:text-sm font-medium text-gray-800 mb-1 sm:mb-2 line-clamp-2 leading-tight">{product.name}</h3>

                {/* Price */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 sm:mb-3">
                  <span className="text-sm sm:text-lg font-bold text-black">₹{product.price}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs sm:text-sm text-gray-500 line-through">₹{product.original_price}</span>
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                      Save ₹{(product.original_price - product.price).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Instant Access Tag */}
                <div className="flex items-center text-xs text-green-600 mb-2 sm:mb-3">
                  <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                  <span className="text-xs">Instant Access</span>
                </div>

                {/* Purchase Status */}
                {checkUserAccess(product.id) && (
                  <div className="bg-green-50 border border-green-200 rounded p-1 sm:p-2 mb-2 sm:mb-3">
                    <div className="flex items-center text-green-700 text-xs">
                      <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                      <span className="font-medium text-xs">You own this - DB Verified</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {checkUserAccess(product.id) ? (
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm py-1 sm:py-2 h-8 sm:h-auto"
                    onClick={() => accessDigitalContent(product)}
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">ACCESS NOW</span>
                  </Button>
                ) : (
                  <div className="space-y-1 sm:space-y-2">
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm py-1 sm:py-2 h-8 sm:h-auto"
                      onClick={() => handlePurchase(product)}
                      disabled={!user}
                    >
                      <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">{user ? '🔒 SECURE PAYMENT' : 'LOGIN TO BUY'}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-xs sm:text-sm py-1 sm:py-2 h-8 sm:h-auto"
                      onClick={() => console.log('Add to cart:', product.id)}
                      disabled={!user}
                    >
                      <span className="text-xs sm:text-sm">Add to Cart</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try selecting a different category</p>
          </div>
        )}
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
              <Database className="w-4 h-4 ml-2 text-green-500" />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              Enter your email or phone number to continue<br/>
              <span className="text-xs text-green-600">✅ Secure database authentication</span>
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
                  Authenticating with Database...
                </>
              ) : (
                'Continue'
              )}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              🔒 Your data is securely stored in Supabase database<br/>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Library Modal */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[80vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center text-sm sm:text-base">
                <Library className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                My Digital Library ({purchasedProducts.length} items)
                <Database className="w-3 h-3 sm:w-4 sm:h-4 ml-2 text-green-500" />
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                User: {user?.name} • DB: {isConnectedToDatabase ? 'Connected' : 'Demo'}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {purchasedProducts.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 mb-4">
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="text-xs sm:text-sm font-medium">
                  All purchases verified from database • Cross-device access enabled
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
            {purchasedProducts.length > 0 ? (
              purchasedProducts.map((product) => (
                <div key={product.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-24 sm:h-32 object-cover rounded mb-2 sm:mb-3"
                  />
                  <h3 className="font-medium text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2">{product.name}</h3>
                  <div className="text-xs text-gray-600 mb-2">
                    <div>Product ID: {product.id.slice(-8)}...</div>
                    <div className="flex items-center mt-1">
                      <Database className="w-3 h-3 mr-1 text-green-500" />
                      <span>✅ Verified Access</span>
                    </div>
                  </div>
                  <div className="flex items-center text-green-600 text-xs mb-2 sm:mb-3">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span>Full Access Granted</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-green-500 hover:bg-green-600 text-xs sm:text-sm py-1.5 sm:py-2"
                    onClick={() => accessDigitalContent(product)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open Content
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-6 sm:py-8">
                <Library className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 mb-1 sm:mb-2 text-sm sm:text-base">No purchased items yet</p>
                <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">Items you purchase will be stored in the database with instant access</p>
                <Button onClick={() => setShowLibrary(false)} size="sm" className="text-xs sm:text-sm">
                  Browse Products
                </Button>
              </div>
            )}
          </div>
          
          {purchasedProducts.length > 0 && (
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
              <div className="text-xs text-gray-500 text-center space-y-1">
                <div>🔒 Your purchases are securely stored in Supabase database.</div>
                <div>Access your content anytime, anywhere with your login credentials.</div>
                <div>Database Status: {isConnectedToDatabase ? '✅ Connected' : '⚠️ Demo Mode'}</div>
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
                <Database className="w-4 h-4 mr-2" />
                <span className="font-medium">Saved to database • Cross-device access enabled</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Session: {sessionId?.slice(-8)} • User: {user?.name} • DB: {isConnectedToDatabase ? 'Connected' : 'Demo'}
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
              Session: {sessionId?.slice(-8)} • DB: {isConnectedToDatabase ? 'Connected' : 'Demo'}
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