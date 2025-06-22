import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Shield, CreditCard, Package, BarChart3, LogOut, User, Clock } from 'lucide-react';
import PaymentVerificationPanel from '@/components/admin/PaymentVerificationPanel';
import AdminProductForm from '@/components/admin/AdminProductForm';
import AdminLogin from '@/components/AdminLogin';

const ADMIN_EMAIL = 'ikeralaklicks@gmail.com';
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours

const Admin = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  // Check admin authentication on component mount
  useEffect(() => {
    checkAdminAuth();
    
    // Set up session timer
    const interval = setInterval(() => {
      updateSessionTimer();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkAdminAuth = () => {
    const adminSession = localStorage.getItem('admin_session');
    const loginTime = localStorage.getItem('admin_login_time');
    
    if (adminSession === 'true' && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      if (elapsed < SESSION_DURATION) {
        setIsAdminAuthenticated(true);
      } else {
        // Session expired
        handleLogout();
        toast({
          title: "Session Expired ⏰",
          description: "Please login again for security",
          variant: "destructive",
        });
      }
    }
  };

  const updateSessionTimer = () => {
    const loginTime = localStorage.getItem('admin_login_time');
    if (loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      const remaining = SESSION_DURATION - elapsed;
      
      if (remaining > 0) {
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        setSessionTimeLeft(`${hours}h ${minutes}m`);
      } else {
        handleLogout();
      }
    }
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_login_time');
    setIsAdminAuthenticated(false);
    toast({
      title: "Logged Out 👋",
      description: "Admin session ended",
      duration: 3000,
    });
  };

  const switchToUserMode = () => {
    toast({
      title: "Switched to User Mode 👤",
      description: "You're now viewing as a regular user",
      duration: 3000,
    });
    window.location.href = '/';
  };

  // Show admin login if not authenticated
  if (!isAdminAuthenticated) {
    return <AdminLogin onAdminLogin={handleAdminLogin} currentUserEmail={user?.email} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <Badge variant="destructive" className="ml-2">ADMIN</Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Current User Info */}
              {user && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Logged as:</span>
                  <span className="text-sm font-medium text-green-900">{user.email}</span>
                </div>
              )}
              
              {/* Session Timer */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">Session:</span>
                <span className="text-sm font-medium text-orange-900">{sessionTimeLeft}</span>
              </div>
              
              {/* Action Buttons */}
              <Button
                onClick={switchToUserMode}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <User className="w-4 h-4 mr-2" />
                User View
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          <p className="text-gray-600 mt-2">
            Manage payments, verify transactions, and oversee product access
          </p>
        </div>
      </div>

      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Payment Verification</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <PaymentVerificationPanel />
          </TabsContent>

          <TabsContent value="products">
            <AdminProductForm onProductAdded={() => {
              toast({
                title: "Product Added Successfully! ✅",
                description: "The new product is now available in the store",
                duration: 4000,
              });
            }} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹0</div>
                  <p className="text-xs text-muted-foreground">+0% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Awaiting verification</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">21</div>
                  <p className="text-xs text-muted-foreground">From linked payments</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Ready for sale</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Admin Session Info</CardTitle>
                <CardDescription>Current session details and security info</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Admin Email</p>
                    <p className="text-sm text-gray-900">{ADMIN_EMAIL}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Session Remaining</p>
                    <p className="text-sm text-gray-900">{sessionTimeLeft}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">User Context</p>
                    <p className="text-sm text-gray-900">{user?.email || 'Not logged in as user'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Payments</p>
                    <p className="text-sm text-gray-900">23 payments in system</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
