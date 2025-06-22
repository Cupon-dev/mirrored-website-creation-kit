import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff, User, LogOut } from 'lucide-react';

const ADMIN_EMAIL = 'ikeralaklicks@gmail.com';
const ADMIN_PASSWORD = 'Arya@2904#';

interface AdminLoginProps {
  onAdminLogin: () => void;
  currentUserEmail?: string;
}

const AdminLogin = ({ onAdminLogin, currentUserEmail }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate loading delay for security
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_session', 'true');
      localStorage.setItem('admin_login_time', Date.now().toString());
      
      toast({
        title: "Admin Access Granted! 🔓",
        description: "Welcome to the admin dashboard",
        duration: 3000,
      });
      
      onAdminLogin();
    } else {
      toast({
        title: "Access Denied ❌",
        description: "Invalid admin credentials",
        variant: "destructive",
        duration: 4000,
      });
    }
    
    setIsLoading(false);
  };

  const switchToUserMode = () => {
    // Clear admin session but keep user session
    localStorage.removeItem('admin_session');
    toast({
      title: "Switched to User Mode 👤",
      description: "You're now viewing as a regular user",
      duration: 3000,
    });
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Access
          </CardTitle>
          <CardDescription className="text-gray-600">
            Secure login required for admin dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current User Status */}
          {currentUserEmail && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Logged in as:</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  User
                </Badge>
              </div>
              <p className="text-sm font-medium text-green-900 mt-1">{currentUserEmail}</p>
              <Button
                onClick={switchToUserMode}
                variant="outline"
                size="sm"
                className="mt-2 w-full border-green-300 text-green-700 hover:bg-green-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Switch to User View
              </Button>
            </div>
          )}

          {/* Admin Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">Admin Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Access Admin Dashboard
                </>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-center">
              🔒 Secure admin access • Session expires after 4 hours • All actions are logged
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;